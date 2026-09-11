/** Job name on the queue; the producer and the worker must agree on it. */
export const OPTIMIZE_TIMETABLE_JOB = "optimize-timetable"

/** Tuning knobs the producer may pass through to the optimizer. */
export interface OptimizeJobOptions {
  /** Fixing the seed makes a run reproducible. */
  seed?: number
  annealingIterations?: number
}

/**
 * What travels on the wire. `data` is left opaque here on purpose: the
 * producer reads it from the database and the worker validates it on arrival,
 * which is where validation belongs.
 */
export interface OptimizeJobEnvelope<TData = unknown> {
  /** Echoed back so the web app can match a result to the task it created. */
  correlationId?: string
  taskId?: number
  data: TData
  options?: OptimizeJobOptions
}
