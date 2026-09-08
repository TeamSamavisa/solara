/**
 * The slice of an optimized class that actually gets written back. Narrower
 * than the worker's `ScheduledClass` so callers can hand over plain data.
 */
export interface PersistableEntry {
  allocation_id: number
  schedule_ids: number[]
  classroom?: { id: number }
}

/**
 * Everything the processor needs from the outside world. Kept behind an
 * interface so the optimization path stays testable without a database.
 */
export interface TimetableSink {
  progress(taskId: number, progress: number): Promise<void>
  persist(entries: PersistableEntry[]): Promise<void>
  complete(taskId: number): Promise<void>
  fail(taskId: number, message: string): Promise<void>
}

/** Best-effort read of the task id from a payload that has not been parsed. */
export function readTaskId(payload: unknown): number | undefined {
  if (typeof payload !== "object" || payload === null) return undefined

  const value = (payload as { taskId?: unknown }).taskId

  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined
}

/**
 * Bookkeeping updates are best-effort: losing one must not fail a job that
 * otherwise produced a valid timetable. Persisting the result is not, because
 * a swallowed error there would silently discard the whole optimization.
 */
export function createDatabaseSink(): TimetableSink {
  return {
    async progress(taskId, progress) {
      const { updateTaskProgress } = await import("@solara/db/actions/tasks")

      try {
        await updateTaskProgress(taskId, progress)
      } catch {
        // Ignored on purpose.
      }
    },

    async persist(entries) {
      const { applyOptimizedSchedule } = await import(
        "@solara/db/actions/timetabling"
      )

      await applyOptimizedSchedule(entries)
    },

    async complete(taskId) {
      const { markTaskCompleted } = await import("@solara/db/actions/tasks")

      try {
        await markTaskCompleted(taskId)
      } catch {
        // Ignored on purpose.
      }
    },

    async fail(taskId, message) {
      const { markTaskFailed } = await import("@solara/db/actions/tasks")

      try {
        await markTaskFailed(taskId, message)
      } catch {
        // Ignored on purpose: the job is already failing.
      }
    },
  }
}
