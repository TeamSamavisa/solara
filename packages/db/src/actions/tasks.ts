import { desc, eq } from "drizzle-orm"

import { db } from "../client"
import {
  createTaskSchema,
  tasks,
  type CreateTaskInput,
  type Task,
  type TaskType,
} from "../schemas"
import { requireFound } from "./utils"

const NOT_FOUND = "Tarefa não encontrada."

/** `error_message` is a TEXT column; keep a sane ceiling on what we store. */
const MAX_ERROR_LENGTH = 2000

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const data = createTaskSchema.parse(input)
  const now = new Date()

  const [inserted] = await db
    .insert(tasks)
    .values({
      correlation_id: data.correlation_id,
      type: data.type,
      status: data.status ?? "PROCESSING",
      progress: 0,
      // Stamped here rather than left to the column default: the live table
      // carries the legacy DDL, where both timestamps are nullable with no
      // default.
      created_at: now,
      updated_at: now,
    })
    .$returningId()

  return getTaskById(inserted.id)
}

export async function getTaskById(id: number): Promise<Task> {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)

  return requireFound(row, NOT_FOUND)
}

/** Returns `null` rather than throwing: a missing correlation is not an error. */
export async function getTaskByCorrelationId(
  correlationId: string,
): Promise<Task | null> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.correlation_id, correlationId))
    .limit(1)

  return row ?? null
}

/**
 * Most recent task of a type, which is what the optimization tab shows.
 *
 * Ordered by the primary key on purpose: it is monotonic and never null,
 * whereas `created_at` is nullable in the live table — and MySQL sorts NULLs
 * last on a descending order, so a freshly created task lost to any older one
 * that happened to carry a timestamp.
 */
export async function getLastTaskByType(type: TaskType): Promise<Task | null> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.type, type))
    .orderBy(desc(tasks.id))
    .limit(1)

  return row ?? null
}

export async function updateTaskProgress(
  id: number,
  progress: number,
): Promise<Task> {
  await ensureTaskExists(id)

  // The worker reports a percentage; guard against anything out of range.
  const clamped = Math.min(100, Math.max(0, Math.round(progress)))

  await db
    .update(tasks)
    .set({ progress: clamped, updated_at: new Date() })
    .where(eq(tasks.id, id))

  return getTaskById(id)
}

export async function markTaskCompleted(id: number): Promise<Task> {
  await ensureTaskExists(id)

  await db
    .update(tasks)
    .set({
      status: "COMPLETED",
      progress: 100,
      error_message: null,
      updated_at: new Date(),
    })
    .where(eq(tasks.id, id))

  return getTaskById(id)
}

export async function markTaskFailed(
  id: number,
  errorMessage: string,
): Promise<Task> {
  await ensureTaskExists(id)

  await db
    .update(tasks)
    .set({
      status: "FAILED",
      error_message: errorMessage.slice(0, MAX_ERROR_LENGTH),
      updated_at: new Date(),
    })
    .where(eq(tasks.id, id))

  return getTaskById(id)
}

async function ensureTaskExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
