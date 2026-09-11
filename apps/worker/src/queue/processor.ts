import { z } from "zod"

import { optimizeJobSchema } from "./jobs"
import type { TimetableSink } from "./sink"
import type { OptimizeReporter } from "@/timetable/events"
import { optimizeTimetable, type OptimizeOutcome } from "@/timetable/optimize"
import { createRandom } from "@/timetable/random"

/** Raised when a job carries a payload the worker cannot act on. */
export class InvalidJobPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidJobPayloadError"
  }
}

export interface JobContext {
  /** BullMQ's `job.updateProgress`, or anything with the same shape. */
  updateProgress?: (progress: number) => unknown
  /** Where the result and the task bookkeeping are written. */
  sink?: TimetableSink
  /** Receives the optimizer's own progress; see `OptimizeEvent`. */
  onEvent?: OptimizeReporter
}

export interface OptimizeJobResult extends OptimizeOutcome {
  correlationId?: string
  taskId?: number
}

/**
 * Progress is reported at coarse checkpoints rather than continuously: the
 * optimizer is synchronous and CPU-bound, so there is no safe point to yield
 * in the middle of a run.
 */
const PROGRESS = { validated: 10, optimized: 90, done: 100 } as const

async function report(context: JobContext | undefined, progress: number) {
  if (!context?.updateProgress) return

  try {
    await context.updateProgress(progress)
  } catch {
    // Losing a progress update must never fail an otherwise good job.
  }
}

export async function processOptimizeJob(
  payload: unknown,
  context?: JobContext,
): Promise<OptimizeJobResult> {
  const parsed = optimizeJobSchema.safeParse(payload)

  if (!parsed.success) {
    throw new InvalidJobPayloadError(
      `Payload inválido para otimização: ${z.prettifyError(parsed.error)}`,
    )
  }

  const { correlationId, taskId, data, options } = parsed.data
  await report(context, PROGRESS.validated)
  await track(context, taskId, PROGRESS.validated)

  const outcome = optimizeTimetable(data, {
    random: options?.seed === undefined ? undefined : createRandom(options.seed),
    annealingIterations: options?.annealingIterations,
    onEvent: context?.onEvent,
  })

  await report(context, PROGRESS.optimized)
  await track(context, taskId, PROGRESS.optimized)

  // Persisting is the point of the job, so a failure here must fail the job
  // rather than leave a task marked as completed with nothing written.
  await context?.sink?.persist(outcome.schedule)

  await report(context, PROGRESS.done)
  if (taskId !== undefined) await context?.sink?.complete(taskId)

  return { ...outcome, correlationId, taskId }
}

async function track(
  context: JobContext | undefined,
  taskId: number | undefined,
  progress: number,
) {
  if (taskId === undefined) return

  await context?.sink?.progress(taskId, progress)
}
