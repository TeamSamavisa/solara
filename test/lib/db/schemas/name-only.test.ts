import {
  createCourseTypeSchema,
  listCourseTypesQuerySchema,
  updateCourseTypeSchema,
} from "@/lib/db/schemas/course-types"
import {
  createShiftSchema,
  listShiftsQuerySchema,
  updateShiftSchema,
} from "@/lib/db/schemas/shifts"
import {
  createSpaceTypeSchema,
  listSpaceTypesQuerySchema,
  updateSpaceTypeSchema,
} from "@/lib/db/schemas/space-types"

const nameOnlyEntities = [
  {
    label: "course type",
    create: createCourseTypeSchema,
    update: updateCourseTypeSchema,
    query: listCourseTypesQuerySchema,
    requiredMessage: "Informe o nome do tipo de curso.",
  },
  {
    label: "shift",
    create: createShiftSchema,
    update: updateShiftSchema,
    query: listShiftsQuerySchema,
    requiredMessage: "Informe o nome do turno.",
  },
  {
    label: "space type",
    create: createSpaceTypeSchema,
    update: updateSpaceTypeSchema,
    query: listSpaceTypesQuerySchema,
    requiredMessage: "Informe o nome do tipo de espaço.",
  },
] as const

describe.each(nameOnlyEntities)(
  "$label schemas",
  ({ create, update, query, requiredMessage }) => {
    describe("create", () => {
      it("accepts a name", () => {
        expect(create.parse({ name: "Bacharelado" })).toEqual({
          name: "Bacharelado",
        })
      })

      it("strips unknown properties", () => {
        expect(create.parse({ name: "X", id: 7 })).toEqual({ name: "X" })
      })

      it("rejects an empty name with the legacy message", () => {
        const result = create.safeParse({ name: "" })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe(requiredMessage)
      })

      it("rejects a missing name", () => {
        expect(create.safeParse({}).success).toBe(false)
      })

      it("rejects a non string name", () => {
        expect(create.safeParse({ name: 42 }).success).toBe(false)
        expect(create.safeParse({ name: null }).success).toBe(false)
      })
    })

    describe("update", () => {
      it("accepts an empty payload", () => {
        expect(update.parse({})).toEqual({})
      })

      it("accepts a new name", () => {
        expect(update.parse({ name: "Novo" })).toEqual({ name: "Novo" })
      })

      it("still rejects an empty name when it is present", () => {
        expect(update.safeParse({ name: "" }).success).toBe(false)
      })
    })

    describe("list query", () => {
      it("fills in the pagination defaults", () => {
        expect(query.parse({})).toEqual({ limit: 10, page: 1 })
      })

      it("keeps the optional name filter", () => {
        expect(query.parse({ name: "Tec" })).toEqual({
          limit: 10,
          page: 1,
          name: "Tec",
        })
      })

      it("rejects a limit outside the allowed range", () => {
        expect(query.safeParse({ limit: 500 }).success).toBe(false)
      })
    })
  },
)
