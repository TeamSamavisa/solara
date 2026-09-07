import { TASK_STATUSES, type TaskStatus } from "@solara/db/schemas/tasks"

/**
 * A task is terminal once the optimizer will no longer touch it, so the queue
 * can stop reporting progress for it.
 */
export function isTerminalStatus(status: TaskStatus): boolean {
  return status === "COMPLETED" || status === "FAILED"
}

/** Statuses the worker is allowed to move a task into. */
export function writableStatuses(): TaskStatus[] {
  return TASK_STATUSES.filter((status) => status !== "PROCESSING")
}
