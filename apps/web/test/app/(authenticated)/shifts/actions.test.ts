import { revalidatePath } from "next/cache"

import {
  createShiftAction,
  deleteShiftAction,
  updateShiftAction,
} from "@/app/(authenticated)/shifts/actions"
import { requireRole } from "@/lib/auth/dal"
import { createShift, removeShift, updateShift } from "@solara/db/actions/shifts"
import { ConflictError, NotFoundError } from "@solara/db/errors"
import { runOnce } from "@solara/db/idempotency"

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }))
jest.mock("@/lib/auth/dal", () => ({ requireRole: jest.fn() }))
jest.mock("@solara/db/actions/shifts", () => ({
  createShift: jest.fn(),
  updateShift: jest.fn(),
  removeShift: jest.fn(),
}))
jest.mock("@solara/db/idempotency", () => ({ runOnce: jest.fn() }))

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>
const mockCreateShift = createShift as jest.MockedFunction<typeof createShift>
const mockUpdateShift = updateShift as jest.MockedFunction<typeof updateShift>
const mockRemoveShift = removeShift as jest.MockedFunction<typeof removeShift>
const mockRunOnce = runOnce as jest.MockedFunction<typeof runOnce>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>

const shift = {
  id: 3,
  name: "Matutino",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

beforeEach(() => {
  mockRequireRole.mockResolvedValue({ userId: 1, role: "admin" })
  mockRunOnce.mockImplementation(async (_scope, _key, operation) => ({
    applied: true,
    result: await operation(),
  }))
})

describe("createShiftAction", () => {
  it("requires the admin role before doing anything", async () => {
    mockRequireRole.mockRejectedValue(new Error("REDIRECT:/error/403"))

    await expect(
      createShiftAction(undefined, form({ name: "Matutino" })),
    ).rejects.toThrow("REDIRECT:/error/403")

    expect(mockCreateShift).not.toHaveBeenCalled()
  })

  it("checks the admin role, not merely coordinator", async () => {
    await createShiftAction(undefined, form({ name: "Matutino" }))

    expect(mockRequireRole).toHaveBeenCalledWith("admin")
  })

  it("creates the shift and revalidates the list", async () => {
    mockCreateShift.mockResolvedValue(shift)

    const state = await createShiftAction(undefined, form({ name: "Matutino" }))

    expect(mockCreateShift).toHaveBeenCalledWith({ name: "Matutino" })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shifts")
    expect(state).toMatchObject({ success: true })
  })

  it("trims the submitted name", async () => {
    mockCreateShift.mockResolvedValue(shift)

    await createShiftAction(undefined, form({ name: "  Matutino  " }))

    expect(mockCreateShift).toHaveBeenCalledWith({ name: "Matutino" })
  })

  it("rejects a blank name without touching the database", async () => {
    const state = await createShiftAction(undefined, form({ name: "   " }))

    expect(state.errors?.name).toEqual(["Informe o nome do turno."])
    expect(mockCreateShift).not.toHaveBeenCalled()
  })

  it("passes the idempotency key through", async () => {
    mockCreateShift.mockResolvedValue(shift)

    await createShiftAction(
      undefined,
      form({ name: "Matutino", idempotencyKey: "abc-123" }),
    )

    expect(mockRunOnce).toHaveBeenCalledWith(
      "shift.create",
      "abc-123",
      expect.any(Function),
    )
  })

  it("reports a replayed submission without creating a duplicate", async () => {
    mockRunOnce.mockResolvedValue({ applied: false })

    const state = await createShiftAction(
      undefined,
      form({ name: "Matutino", idempotencyKey: "abc-123" }),
    )

    expect(state).toMatchObject({
      success: true,
      message: "Este turno já havia sido criado.",
    })
    expect(mockCreateShift).not.toHaveBeenCalled()
  })

  it("surfaces a domain error as a form message", async () => {
    mockRunOnce.mockRejectedValue(new ConflictError("Nome já utilizado"))

    const state = await createShiftAction(undefined, form({ name: "Matutino" }))

    expect(state.message).toBe("Nome já utilizado")
    expect(state.success).toBeUndefined()
  })

  it("hides unexpected failures behind a generic message", async () => {
    mockRunOnce.mockRejectedValue(new Error("ECONNREFUSED 10.0.0.1:3306"))

    const state = await createShiftAction(undefined, form({ name: "Matutino" }))

    expect(state.message).toBe("Não foi possível criar o turno.")
    expect(state.message).not.toContain("ECONNREFUSED")
  })
})

describe("updateShiftAction", () => {
  it("requires the admin role", async () => {
    await updateShiftAction(undefined, form({ id: "3", name: "Noturno" }))

    expect(mockRequireRole).toHaveBeenCalledWith("admin")
  })

  it("updates the shift and revalidates", async () => {
    mockUpdateShift.mockResolvedValue({ ...shift, name: "Noturno" })

    const state = await updateShiftAction(
      undefined,
      form({ id: "3", name: "Noturno" }),
    )

    expect(mockUpdateShift).toHaveBeenCalledWith(3, { name: "Noturno" })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shifts")
    expect(state.success).toBe(true)
  })

  it.each(["", "abc", "0", "-1", "1.5"])(
    "refuses the invalid id %p",
    async (id) => {
      const state = await updateShiftAction(
        undefined,
        form({ id, name: "Noturno" }),
      )

      expect(state.message).toBe("Turno inválido.")
      expect(mockUpdateShift).not.toHaveBeenCalled()
    },
  )

  it("rejects a blank name", async () => {
    const state = await updateShiftAction(
      undefined,
      form({ id: "3", name: "  " }),
    )

    expect(state.errors?.name).toEqual(["Informe o nome do turno."])
    expect(mockUpdateShift).not.toHaveBeenCalled()
  })

  it("reports a shift that no longer exists", async () => {
    mockUpdateShift.mockRejectedValue(new NotFoundError("Turno não encontrado."))

    const state = await updateShiftAction(
      undefined,
      form({ id: "3", name: "Noturno" }),
    )

    expect(state.message).toBe("Turno não encontrado.")
  })
})

describe("deleteShiftAction", () => {
  it("requires the admin role", async () => {
    await deleteShiftAction(undefined, form({ id: "3" }))

    expect(mockRequireRole).toHaveBeenCalledWith("admin")
  })

  it("deletes the shift and revalidates", async () => {
    mockRemoveShift.mockResolvedValue(shift)

    const state = await deleteShiftAction(undefined, form({ id: "3" }))

    expect(mockRemoveShift).toHaveBeenCalledWith(3)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shifts")
    expect(state.success).toBe(true)
  })

  it("is idempotent: deleting twice still reports success", async () => {
    mockRemoveShift.mockRejectedValue(new NotFoundError("Turno não encontrado."))

    const state = await deleteShiftAction(undefined, form({ id: "3" }))

    expect(state.success).toBe(true)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shifts")
  })

  it("still reports an unexpected failure", async () => {
    mockRemoveShift.mockRejectedValue(new Error("connection lost"))

    const state = await deleteShiftAction(undefined, form({ id: "3" }))

    expect(state.message).toBe("Não foi possível excluir o turno.")
    expect(state.success).toBeUndefined()
  })

  it("refuses an invalid id", async () => {
    const state = await deleteShiftAction(undefined, form({ id: "abc" }))

    expect(state.message).toBe("Turno inválido.")
    expect(mockRemoveShift).not.toHaveBeenCalled()
  })
})
