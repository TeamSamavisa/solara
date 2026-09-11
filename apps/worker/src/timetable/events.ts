import type { Conflict } from "./conflicts"
import type { FailedPlacement } from "./placement"
import type { OptimizationStatistics } from "./result"

/** Hard-constraint cost broken down the way the legacy service reported it. */
export interface CostSummary {
  total: number
  teacher: number
  classroom: number
  group: number
  availability: number
}

/**
 * What the optimizer says about its own progress. The run is synchronous and
 * CPU-bound, so a handler must stay cheap — writing a line is fine, awaiting
 * anything is not, since nothing else can run until the optimization returns.
 */
export type OptimizeEvent =
  | {
      type: "prepared"
      allocations: number
      classrooms: number
      teachers: number
      schedules: number
    }
  | {
      type: "initial-placement"
      placed: number
      total: number
      failed: FailedPlacement[]
    }
  | { type: "initial-cost"; cost: CostSummary }
  /** The initial placement already satisfies every hard constraint. */
  | { type: "optimal" }
  | { type: "conflicts"; conflicts: Conflict[] }
  | {
      type: "annealing-progress"
      iteration: number
      iterations: number
      cost: number
      /** Best cost seen so far, which is what the run will return. */
      best: number
    }
  | { type: "statistics"; statistics: OptimizationStatistics }

export type OptimizeReporter = (event: OptimizeEvent) => void

/**
 * Wraps a reporter so a broken logger can never fail an optimization, and so
 * the optimizer does not have to null-check on every emit.
 */
export function safeReporter(reporter?: OptimizeReporter): OptimizeReporter {
  if (!reporter) return () => {}

  return (event) => {
    try {
      reporter(event)
    } catch {
      // Losing a log line is never worth losing the run.
    }
  }
}
