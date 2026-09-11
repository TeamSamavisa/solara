import { emptySpaceCost, hardConstraintsCost } from "./costs"
import type { HardConstraintsCost } from "./costs"
import { findConflicts } from "./conflicts"
import {
  safeReporter,
  type CostSummary,
  type OptimizeEvent,
  type OptimizeReporter,
} from "./events"
import { prepareTimetable, type PreparedTimetable } from "./model"
import {
  createState,
  mutateIdealSpot,
  placeInitial,
  type FailedPlacement,
  type TimetableState,
} from "./placement"
import { buildResult, type OptimizationResult } from "./result"
import { createRandom } from "./random"
import type { TimetableInput } from "./schema"

export interface OptimizeOptions {
  /** Injected so a run can be reproduced; defaults to a clock-seeded stream. */
  random?: () => number
  annealingIterations?: number
  /** Receives progress as the run unfolds; see `OptimizeEvent`. */
  onEvent?: OptimizeReporter
}

export interface OptimizeOutcome extends OptimizationResult {
  unplaced: FailedPlacement[]
}

const DEFAULTS = {
  annealingIterations: 2500,
  initialTemperature: 0.5,
  coolingFactor: 0.99,
  /** Matches the legacy `i % 100 == 0` reporting cadence. */
  annealingReportEvery: 100,
}

/**
 * How many classes the annealing tries to relocate per iteration — a quarter
 * of the timetable, as in the legacy service.
 *
 * Deliberate fix over the original: it rounded to zero for a timetable of
 * fewer than four classes and never touched it.
 */
export function mutationBatchSize(totalAllocations: number): number {
  return Math.max(1, Math.floor(totalAllocations / 4))
}

function summarise(cost: HardConstraintsCost): CostSummary {
  return {
    total: cost.total,
    teacher: cost.teacher,
    classroom: cost.classroom,
    group: cost.group,
    availability: cost.availability,
  }
}

function snapshot(state: TimetableState) {
  return {
    matrix: state.matrix.map((row) => [...row]),
    free: state.free.map((cell) => ({ ...cell })),
    filled: new Map(
      [...state.filled].map(([index, cells]) => [
        index,
        cells.map((cell) => ({ ...cell })),
      ]),
    ),
    groupOccupancy: new Map(
      [...state.groupOccupancy].map(([id, rows]) => [id, [...rows]]),
    ),
    teacherOccupancy: new Map(
      [...state.teacherOccupancy].map(([id, rows]) => [id, [...rows]]),
    ),
    freeKeys: new Set(state.freeKeys),
  }
}

/**
 * Restores a snapshot in place.
 *
 * Deliberate fix over the legacy implementation: its annealing rebound local
 * variables to the saved copies, which never propagated back to the caller.
 * Rejected moves therefore leaked into the final timetable.
 */
function restore(state: TimetableState, saved: ReturnType<typeof snapshot>) {
  state.matrix = saved.matrix
  state.free = saved.free
  state.filled = saved.filled
  state.groupOccupancy = saved.groupOccupancy
  state.teacherOccupancy = saved.teacherOccupancy
  state.freeKeys = saved.freeKeys
}

/**
 * Checks the timetable right after placement and says what is still broken.
 *
 * There is deliberately no evolution loop here. The legacy Python worker
 * needed one because its initializer ignored teacher/group conflicts
 * entirely, leaving a mess for the evolutionary phase to fix. This port's
 * `placeInitial` already takes the first *conflict-free* spot for every
 * class, and `mutateIdealSpot` (used by the annealing) only moves a class
 * into conflict-free spots — so after placement no conflict has a
 * destination the placement did not already know about, and an evolution
 * loop would iterate without ever lowering the cost. Mutation testing
 * confirmed it: every mutant inside the old loop body survived, because the
 * body had no observable effect.
 */
function reportHardConstraintStatus(
  cost: HardConstraintsCost,
  prepared: PreparedTimetable,
  state: TimetableState,
  report: OptimizeReporter,
): void {
  if (cost.total === 0) {
    report({ type: "optimal" })
    return
  }

  report({
    type: "conflicts",
    conflicts: findConflicts(state.matrix, prepared),
  })
}

/**
 * Simulated annealing over the soft constraint: the gaps left in each class
 * group's day. Moves that worsen the cost are accepted with a probability
 * that decays with the temperature, which helps escape local minima.
 *
 * Deliberate improvement over both the original and the legacy service: they
 * returned whatever they last accepted, so a run that wandered uphill late
 * handed back a timetable worse than the one it was given. This keeps the
 * best state it saw and restores it at the end.
 *
 * Exposed so tests can assert on that guarantee directly.
 */
export function runAnnealing(
  state: TimetableState,
  prepared: PreparedTimetable,
  random: () => number,
  iterations: number,
  report: OptimizeReporter,
): void {
  const allocationCount = prepared.allocations.length
  if (allocationCount === 0) return

  let temperature = DEFAULTS.initialTemperature
  let currentCost = emptySpaceCost(state.groupOccupancy).average

  let best = snapshot(state)
  let bestHard = hardConstraintsCost(state.matrix, prepared).total
  let bestSoft = currentCost

  for (let i = 0; i < iterations; i += 1) {
    const roll = random()
    temperature *= DEFAULTS.coolingFactor

    const saved = snapshot(state)
    const hardBefore = hardConstraintsCost(state.matrix, prepared).total

    const batch = mutationBatchSize(allocationCount)
    for (let j = 0; j < batch; j += 1) {
      const index = Math.floor(random() * allocationCount)
      mutateIdealSpot(state, prepared, index)
    }

    const newCost = emptySpaceCost(state.groupOccupancy).average
    const hardAfter = hardConstraintsCost(state.matrix, prepared).total

    // Softening gaps must never cost a hard constraint.
    const accept =
      hardAfter <= hardBefore &&
      (newCost < currentCost ||
        roll <= Math.exp((currentCost - newCost) / temperature))

    if (accept) {
      currentCost = newCost

      // Hard constraints first: a smaller gap is never worth a new conflict.
      if (hardAfter < bestHard || (hardAfter === bestHard && newCost < bestSoft)) {
        best = snapshot(state)
        bestHard = hardAfter
        bestSoft = newCost
      }
    } else {
      restore(state, saved)
    }

    if (i % DEFAULTS.annealingReportEvery === 0) {
      report({
        type: "annealing-progress",
        iteration: i,
        iterations,
        cost: currentCost,
        best: bestSoft,
      })
    }
  }

  restore(state, best)
}

/** Runs both phases, returning the solved state and what could not be placed. */
function solve(
  prepared: PreparedTimetable,
  options: OptimizeOptions,
): { state: TimetableState; unplaced: FailedPlacement[] } {
  const random = options.random ?? createRandom(Date.now())
  const report = safeReporter(options.onEvent)
  const state = createState(prepared)

  report({
    type: "prepared",
    allocations: prepared.allocations.length,
    classrooms: prepared.classrooms.length,
    teachers: prepared.teacherIds.length,
    schedules: prepared.schedules.size,
  })

  const initial = placeInitial(state, prepared, random)

  report({
    type: "initial-placement",
    placed: prepared.allocations.length - initial.failed.length,
    total: prepared.allocations.length,
    failed: initial.failed,
  })

  const initialCost = hardConstraintsCost(state.matrix, prepared)
  report({ type: "initial-cost", cost: summarise(initialCost) })
  reportHardConstraintStatus(initialCost, prepared, state, report)

  runAnnealing(
    state,
    prepared,
    random,
    options.annealingIterations ?? DEFAULTS.annealingIterations,
    report,
  )

  return { state, unplaced: initial.failed }
}

/** Exposed so tests can assert on the grid itself, not only on the payload. */
export function runOptimization(
  prepared: PreparedTimetable,
  options: OptimizeOptions = {},
): TimetableState {
  return solve(prepared, options).state
}

export function optimizeTimetable(
  input: TimetableInput,
  options: OptimizeOptions = {},
): OptimizeOutcome {
  const prepared = prepareTimetable(input)
  const { state, unplaced } = solve(prepared, options)
  const result = buildResult(state, prepared)

  safeReporter(options.onEvent)({
    type: "statistics",
    statistics: result.statistics,
  })

  return { ...result, unplaced }
}

export type { OptimizeEvent, OptimizeReporter }
