"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/dal"
import type { FormState } from "@/lib/forms"
import {
  createTask,
  getLastTaskByType,
  markTaskFailed,
} from "@solara/db/actions/tasks"
import {
  collectTimetableData,
  getAllocationStatistics,
  type AllocationStatistics,
} from "@solara/db/actions/timetabling"
import { enqueueOptimization } from "@solara/queue/producer"

const TASK_TYPE = "TIMETABLE_OPTIMIZATION"
const PATH = "/assignments"

/** Task as the client sees it: plain data, timestamps already serialised. */
export interface OptimizationTaskView {
  id: number
  status: string
  progress: number
  errorMessage: string | null
  finishedAt: string
}

export interface OptimizationStatus {
  task: OptimizationTaskView | null
  statistics: AllocationStatistics
}

export async function startOptimization(
  _state: FormState | undefined,
  _formData: FormData,
): Promise<FormState> {
  await requireRole("admin")

  try {
    const last = await getLastTaskByType(TASK_TYPE)

    if (last?.status === "PROCESSING") {
      return { message: "Já existe uma otimização em andamento." }
    }

    const data = await collectTimetableData()

    if (data.class_allocations.length === 0) {
      return {
        message: "Nenhuma alocação cadastrada para otimizar.",
      }
    }

    // The task is created first so the tab can show progress immediately,
    // even if the worker takes a moment to pick the job up.
    const task = await createTask({
      correlation_id: crypto.randomUUID(),
      type: TASK_TYPE,
    })

    try {
      await enqueueOptimization({
        correlationId: task.correlation_id,
        taskId: task.id,
        data,
      })
    } catch {
      // Otherwise the task would sit at PROCESSING forever.
      await markTaskFailed(task.id, "Não foi possível enfileirar a otimização.")

      return { message: "Não foi possível enviar o trabalho para a fila." }
    }

    revalidatePath(PATH)

    return { success: true, message: "Otimização iniciada." }
  } catch {
    return { message: "Não foi possível iniciar a otimização." }
  }
}

export async function getOptimizationStatus(): Promise<OptimizationStatus> {
  await requireRole("coordinator")

  const [task, statistics] = await Promise.all([
    getLastTaskByType(TASK_TYPE),
    getAllocationStatistics(),
  ])

  return {
    task: task && {
      id: task.id,
      status: task.status,
      progress: task.progress ?? 0,
      errorMessage: task.error_message ?? null,
      finishedAt: new Date(task.updated_at ?? task.created_at).toISOString(),
    },
    statistics,
  }
}
