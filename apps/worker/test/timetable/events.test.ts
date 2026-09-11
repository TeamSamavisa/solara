import { optimizeTimetable } from "@/timetable/optimize"
import { createRandom } from "@/timetable/random"
import type { OptimizeEvent } from "@/timetable/events"
import { buildInput } from "@test/support/timetable"

const fastOptions = {
  annealingIterations: 300,
}

function collect(input = buildInput(), options = fastOptions) {
  const events: OptimizeEvent[] = []

  optimizeTimetable(input, {
    ...options,
    random: createRandom(1),
    onEvent: (event) => events.push(event),
  })

  return events
}

function typesOf(events: OptimizeEvent[]) {
  return [...new Set(events.map((event) => event.type))]
}

describe("optimization events", () => {
  it("reports the size of the problem before starting", () => {
    const events = collect()
    const prepared = events.find((event) => event.type === "prepared")

    expect(prepared).toMatchObject({
      allocations: 2,
      classrooms: expect.any(Number),
      teachers: expect.any(Number),
      schedules: expect.any(Number),
    })
  })

  it("reports the size first, before anything else happened", () => {
    expect(collect()[0].type).toBe("prepared")
  })

  it("reports how many classes the initial placement managed to seat", () => {
    const events = collect()
    const placement = events.find(
      (event) => event.type === "initial-placement",
    )

    expect(placement).toMatchObject({ placed: 2, total: 2, failed: [] })
  })

  it("lists what it could not place", () => {
    const input = buildInput()
    const events = collect({
      ...input,
      // No classroom has this space type, so the classes have nowhere to go.
      subjects: input.subjects.map((subject) => ({
        ...subject,
        required_space_type_id: 2,
      })),
    })
    const placement = events.find((event) => event.type === "initial-placement")

    expect(placement).toMatchObject({ placed: 0, total: 2 })
    expect(
      placement?.type === "initial-placement" && placement.failed.length,
    ).toBe(2)
  })

  it("reports the cost it starts from", () => {
    const events = collect()
    const initial = events.find((event) => event.type === "initial-cost")

    expect(initial).toMatchObject({
      cost: {
        total: expect.any(Number),
        teacher: expect.any(Number),
        classroom: expect.any(Number),
        group: expect.any(Number),
        availability: expect.any(Number),
      },
    })
  })

  it("says so when placement already satisfies every hard constraint", () => {
    // There is no evolution phase: placement takes the first conflict-free
    // spot for each class, so a clean result is known right away.
    const events = collect()

    expect(events.some((event) => event.type === "optimal")).toBe(true)
    expect(events.some((event) => event.type === "conflicts")).toBe(false)
  })

  it("reports annealing progress periodically, not on every iteration", () => {
    const progress = collect().filter(
      (event) => event.type === "annealing-progress",
    )

    expect(progress.length).toBeGreaterThan(0)
    expect(progress.length).toBeLessThan(20)
    expect(progress[0]).toMatchObject({
      iteration: expect.any(Number),
      iterations: 300,
      cost: expect.any(Number),
      best: expect.any(Number),
    })
  })

  it("closes with the final statistics", () => {
    const events = collect()
    const last = events[events.length - 1]

    expect(last.type).toBe("statistics")
    expect(last.type === "statistics" && last.statistics).toMatchObject({
      hard_constraints_satisfied: expect.any(Boolean),
      placed_allocations: expect.any(Number),
    })
  })

  it("emits the phases in order", () => {
    const types = typesOf(collect())

    expect(types.indexOf("prepared")).toBeLessThan(
      types.indexOf("initial-placement"),
    )
    expect(types.indexOf("initial-placement")).toBeLessThan(
      types.indexOf("initial-cost"),
    )
    expect(types.indexOf("initial-cost")).toBeLessThan(
      types.indexOf("statistics"),
    )
  })

  it("runs exactly the same without a reporter", () => {
    const input = buildInput()
    const withReporter = optimizeTimetable(input, {
      ...fastOptions,
      random: createRandom(1),
      onEvent: () => {},
    })
    const without = optimizeTimetable(input, {
      ...fastOptions,
      random: createRandom(1),
    })

    expect(withReporter.schedule).toEqual(without.schedule)
  })

  it("is not derailed by a reporter that throws", () => {
    expect(() =>
      optimizeTimetable(buildInput(), {
        ...fastOptions,
        onEvent: () => {
          throw new Error("logger caiu")
        },
      }),
    ).not.toThrow()
  })

  it("still reports on a timetable with nothing to schedule", () => {
    const events = collect({ ...buildInput(), class_allocations: [] })

    expect(typesOf(events)).toContain("prepared")
    expect(typesOf(events)).toContain("statistics")
  })
})

describe("conflict reporting", () => {
  it("explains what is still broken when no clean placement exists", () => {
    const input = buildInput()
    const events = collect({
      ...input,
      // One usable slot and one class group: the two classes must overlap.
      schedules: input.schedules.slice(0, 1),
      teacher_schedules: {},
      class_allocations: input.class_allocations.map((allocation) => ({
        ...allocation,
        class_group_id: 30,
      })),
    })

    const conflicts = events.filter((event) => event.type === "conflicts")

    expect(conflicts).toHaveLength(1)
    expect(
      conflicts[0].type === "conflicts" && conflicts[0].conflicts.length,
    ).toBeGreaterThan(0)
    // The verdict comes before the annealing: it cannot fix hard conflicts.
    expect(typesOf(events).indexOf("conflicts")).toBeLessThan(
      typesOf(events).indexOf("statistics"),
    )
  })

  it("says nothing about conflicts once the timetable is clean", () => {
    const events = collect()

    expect(events.find((event) => event.type === "conflicts")).toBeUndefined()
  })
})