import { Queue } from "bullmq"

import { loadQueueConfig, type QueueConfig } from "./config"
import { OPTIMIZE_TIMETABLE_JOB, type OptimizeJobEnvelope } from "./jobs"

export interface EnqueueOptions {
  env?: Record<string, string | undefined>
}

export interface EnqueueResult {
  jobId: string | undefined
}

/**
 * Optimization is expensive and user-triggered: a failed run should surface as
 * a failed task the user can retry, not silently repeat itself.
 */
const JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 50 },
} as const

/**
 * One queue per process. Next.js server actions run many times in the same
 * process, and opening a Redis connection per call would leak them.
 */
let queue: Queue | null = null
let queueKey: string | null = null

function getQueue(config: QueueConfig): Queue {
  const key = JSON.stringify([config.queueName, config.connection])

  if (queue && queueKey === key) return queue

  queue = new Queue(config.queueName, { connection: config.connection })
  queueKey = key

  return queue
}

export async function enqueueOptimization<TData>(
  envelope: OptimizeJobEnvelope<TData>,
  options: EnqueueOptions = {},
): Promise<EnqueueResult> {
  const config = loadQueueConfig(options.env)
  const job = await getQueue(config).add(
    OPTIMIZE_TIMETABLE_JOB,
    envelope,
    JOB_OPTIONS,
  )

  return { jobId: job.id }
}

/** Closes the shared queue; used on shutdown and between tests. */
export async function resetOptimizationQueue(): Promise<void> {
  if (!queue) return

  const open = queue
  queue = null
  queueKey = null

  await open.close()
}
