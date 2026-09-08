import { Worker, type Job, type Processor } from "bullmq"

import { loadQueueConfig, type QueueConfig } from "@solara/queue/config"
import { OPTIMIZE_TIMETABLE_JOB } from "./jobs"
import {
  InvalidJobPayloadError,
  processOptimizeJob,
  type OptimizeJobResult,
} from "./processor"
import { createConsoleReporter } from "./reporter"
import { createDatabaseSink, readTaskId, type TimetableSink } from "./sink"
import type { OptimizeReporter } from "@/timetable/events"

export interface HandleJobOptions {
  sink?: TimetableSink
  onEvent?: OptimizeReporter
}

/**
 * Handles one job. Kept separate from the BullMQ wiring so it can be tested
 * without a Redis server.
 */
export async function handleJob(
  job: Pick<Job, "name" | "data" | "updateProgress">,
  _token?: string,
  options: HandleJobOptions = {},
): Promise<OptimizeJobResult> {
  const { sink, onEvent } = options

  try {
    if (job.name !== OPTIMIZE_TIMETABLE_JOB) {
      throw new InvalidJobPayloadError(`Job desconhecido: ${job.name}`)
    }

    return await processOptimizeJob(job.data, {
      updateProgress: (progress) => job.updateProgress(progress),
      sink,
      onEvent,
    })
  } catch (error) {
    // The payload may never have been parsed, so read the id defensively.
    const taskId = readTaskId(job.data)

    if (sink && taskId !== undefined) {
      try {
        await sink.fail(taskId, messageOf(error))
      } catch {
        // Reporting the failure must never replace the error that caused it.
      }
    }

    throw error
  }
}

/**
 * What gets written to the task row, and from there to the screen. A payload
 * problem is worth showing; anything else could carry infrastructure detail
 * (hosts, credentials), so it stays in the worker log instead.
 */
function messageOf(error: unknown): string {
  if (error instanceof InvalidJobPayloadError) return error.message

  return "Falha ao executar a otimização."
}

export function createOptimizationWorker(
  config: QueueConfig = loadQueueConfig(),
  sink: TimetableSink = createDatabaseSink(),
  onEvent: OptimizeReporter = createConsoleReporter(),
): Worker<unknown, OptimizeJobResult> {
  const processor: Processor<unknown, OptimizeJobResult> = (job, token) =>
    handleJob(job, token, { sink, onEvent })

  return new Worker<unknown, OptimizeJobResult>(config.queueName, processor, {
    connection: config.connection,
    concurrency: config.concurrency,
  })
}