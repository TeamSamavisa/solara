import { createConsoleReporter, formatEvent } from "@/queue/reporter"
import type { OptimizeEvent } from "@/timetable/events"

function lines(event: OptimizeEvent) {
  return formatEvent(event).join("\n")
}

function failure(overrides: Record<string, unknown> = {}) {
  return {
    allocationId: 300,
    classGroup: "ADS 1",
    subject: "Banco de Dados",
    teacher: "Ana Souza",
    duration: 2,
    compatibleClassrooms: 0,
    ...overrides,
  }
}

describe("formatEvent", () => {
  it("states the size of the problem", () => {
    expect(
      lines({
        type: "prepared",
        allocations: 289,
        classrooms: 37,
        teachers: 62,
        schedules: 85,
      }),
    ).toMatch(/289.*37.*62.*85/)
  })

  it("states how many classes were seated initially", () => {
    expect(
      lines({
        type: "initial-placement",
        placed: 287,
        total: 289,
        failed: [],
      }),
    ).toContain("287/289")
  })

  it("names what it could not place", () => {
    const text = lines({
      type: "initial-placement",
      placed: 288,
      total: 289,
      failed: [failure()],
    })

    expect(text).toContain("ADS 1")
    expect(text).toContain("Banco de Dados")
    expect(text).toContain("Ana Souza")
  })

  it("keeps a long failure list readable", () => {
    const failed = Array.from({ length: 25 }, (_, index) =>
      failure({ allocationId: index, subject: `Disciplina ${index}` }),
    )

    const text = formatEvent({
      type: "initial-placement",
      placed: 0,
      total: 25,
      failed,
    })

    expect(text.length).toBeLessThan(16)
    expect(text.join("\n")).toContain("15")
  })

  it("says nothing extra when everything was placed", () => {
    const text = lines({
      type: "initial-placement",
      placed: 289,
      total: 289,
      failed: [],
    })

    expect(text).not.toMatch(/could not/i)
  })

  it("breaks the starting cost down by constraint", () => {
    const text = lines({
      type: "initial-cost",
      cost: {
        total: 42,
        teacher: 10,
        classroom: 8,
        group: 20,
        availability: 4,
      },
    })

    expect(text).toContain("42")
    expect(text).toMatch(/teacher/i)
    expect(text).toMatch(/classroom/i)
    expect(text).toMatch(/availability/i)
  })

  it("celebrates an immediately clean placement", () => {
    expect(lines({ type: "optimal" })).toMatch(/hard constraints satisfied/i)
  })

  it("reports annealing progress with the current cost", () => {
    const text = lines({
      type: "annealing-progress",
      iteration: 100,
      iterations: 2500,
      cost: 0.8333333333,
      best: 0.25,
    })

    expect(text).toContain("100/2500")
    expect(text).toContain("0.8333")
    expect(text).toContain("0.2500")
  })

  it("summarises the final statistics", () => {
    const text = lines({
      type: "statistics",
      statistics: {
        hard_constraints_satisfied: true,
        hard_constraints_cost: 0,
        total_allocations: 289,
        placed_allocations: 289,
        groups_empty_space: { total: 12, max_per_day: 2, average_per_week: 0.4 },
        teachers_empty_space: { total: 8, max_per_day: 1, average_per_week: 0.1 },
      },
    })

    expect(text).toContain("289/289")
    expect(text).toContain("12")
    expect(text).toContain("8")
  })

  it("flags a timetable that still breaks hard constraints", () => {
    const text = lines({
      type: "statistics",
      statistics: {
        hard_constraints_satisfied: false,
        hard_constraints_cost: 6,
        total_allocations: 10,
        placed_allocations: 9,
        groups_empty_space: { total: 0, max_per_day: 0, average_per_week: 0 },
        teachers_empty_space: { total: 0, max_per_day: 0, average_per_week: 0 },
      },
    })

    expect(text).toMatch(/not satisfied/i)
    expect(text).toContain("6")
  })
})

describe("createConsoleReporter", () => {
  it("writes every line of an event", () => {
    const log = jest.fn()

    createConsoleReporter(log)({
      type: "initial-placement",
      placed: 1,
      total: 2,
      failed: [failure()],
    })

    expect(log.mock.calls.length).toBeGreaterThan(1)
  })

  it("prefixes each line, so the lines are greppable", () => {
    const log = jest.fn()

    createConsoleReporter(log)({ type: "optimal" })

    expect(log).toHaveBeenCalledWith(expect.stringContaining("timetable:"))
  })

  it("defaults to the console", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {})

    createConsoleReporter()({ type: "optimal" })

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe("formatEvent for conflicts", () => {
  const conflict = {
    scope: "teacher" as const,
    name: "Ana Souza",
    slot: "Monday 07h",
    classes: ["ADS 1 · Banco de Dados · Ana Souza", "ADS 2 · Redes · Ana Souza"],
  }

  it("names who clashes, when, and with what", () => {
    const text = lines({ type: "conflicts", conflicts: [conflict] })

    expect(text).toContain("Monday 07h")
    expect(text).toContain("Ana Souza")
    expect(text).toContain("Banco de Dados")
  })

  it("says which kind of clash it is", () => {
    expect(lines({ type: "conflicts", conflicts: [conflict] })).toMatch(
      /double-booked/i,
    )
  })

  it("labels an availability breach differently", () => {
    const text = lines({
      type: "conflicts",
      conflicts: [{ ...conflict, scope: "availability" }],
    })

    expect(text).toMatch(/availability/i)
  })

  it("says nothing when there is nothing to report", () => {
    expect(formatEvent({ type: "conflicts", conflicts: [] })).toEqual([])
  })

  it("keeps a long list readable", () => {
    const conflicts = Array.from({ length: 30 }, () => conflict)

    const text = formatEvent({ type: "conflicts", conflicts })

    expect(text.join("\n")).toContain("20")
    expect(text.length).toBeLessThan(35)
  })
})