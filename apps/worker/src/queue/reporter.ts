import type { CostSummary, OptimizeEvent, OptimizeReporter } from "@/timetable/events"
import type { FailedPlacement } from "@/timetable/placement"

const PREFIX = "timetable:"

/** A long failure list is noise; the count says the rest. */
const MAX_LISTED_FAILURES = 10
const MAX_LISTED_CONFLICTS = 10

const SCOPES = {
  teacher: "teacher double-booked:",
  "class-group": "class group double-booked:",
  availability: "outside declared availability:",
} as const

function breakdown(cost: CostSummary): string {
  return `teachers ${cost.teacher}, class groups ${cost.group}, classrooms ${cost.classroom}, availability ${cost.availability}`
}

function describeFailure(failure: FailedPlacement): string {
  return `  - ${failure.classGroup} · ${failure.subject} · ${failure.teacher} (${failure.duration}h, ${failure.compatibleClassrooms} compatible rooms)`
}

/**
 * Turns an optimizer event into log lines, mirroring what the legacy Python
 * service printed: iterations, cost breakdown and the annealing curve.
 */
export function formatEvent(event: OptimizeEvent): string[] {
  switch (event.type) {
    case "prepared":
      return [
        `${event.allocations} allocations, ${event.classrooms} classrooms, ${event.teachers} teachers, ${event.schedules} schedules`,
      ]

    case "initial-placement": {
      const lines = [`initial placement ${event.placed}/${event.total}`]

      if (event.failed.length > 0) {
        lines.push(`${event.failed.length} allocation(s) could not be placed:`)
        lines.push(
          ...event.failed.slice(0, MAX_LISTED_FAILURES).map(describeFailure),
        )

        const hidden = event.failed.length - MAX_LISTED_FAILURES
        if (hidden > 0) lines.push(`  ... and ${hidden} more`)
      }

      return lines
    }

    case "initial-cost":
      return [`initial hard cost ${event.cost.total} (${breakdown(event.cost)})`]

    case "evolution-run":
      return [
        `run ${event.run}/${event.runs} | sigma ${event.sigma.toFixed(4)}`,
      ]

    case "evolution-result":
      return [
        `run ${event.run} ended after ${event.iterations} iterations | cost ${event.cost.total} (${breakdown(event.cost)})`,
      ]

    case "optimal":
      return [
        `optimal solution found on run ${event.run} after ${event.iterations} iterations`,
      ]

    case "conflicts": {
      if (event.conflicts.length === 0) return []

      const lines = [`${event.conflicts.length} unresolved conflict(s):`]

      for (const conflict of event.conflicts.slice(0, MAX_LISTED_CONFLICTS)) {
        lines.push(`  ${conflict.slot} · ${SCOPES[conflict.scope]} ${conflict.name}`)
        lines.push(...conflict.classes.map((entry) => `      ${entry}`))
      }

      const hidden = event.conflicts.length - MAX_LISTED_CONFLICTS
      if (hidden > 0) lines.push(`  ... and ${hidden} more`)

      return lines
    }

    case "annealing-progress":
      return [
        `annealing ${event.iteration}/${event.iterations} | average gap ${event.cost.toFixed(8)} | best ${event.best.toFixed(8)}`,
      ]

    case "statistics": {
      const { statistics } = event
      const groups = statistics.groups_empty_space
      const teachers = statistics.teachers_empty_space

      return [
        statistics.hard_constraints_satisfied
          ? `done | hard constraints satisfied | ${statistics.placed_allocations}/${statistics.total_allocations} placed`
          : `done | hard constraints NOT satisfied, cost ${statistics.hard_constraints_cost} | ${statistics.placed_allocations}/${statistics.total_allocations} placed`,
        `  class group gaps: total ${groups.total}, max/day ${groups.max_per_day}, avg/week ${groups.average_per_week.toFixed(2)}`,
        `  teacher gaps: total ${teachers.total}, max/day ${teachers.max_per_day}, avg/week ${teachers.average_per_week.toFixed(2)}`,
      ]
    }
  }
}

export function createConsoleReporter(
  log: (line: string) => void = console.log,
): OptimizeReporter {
  return (event) => {
    for (const line of formatEvent(event)) {
      log(`${PREFIX} ${line}`)
    }
  }
}
