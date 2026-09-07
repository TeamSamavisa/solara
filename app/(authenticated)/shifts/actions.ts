"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import { createShift, removeShift, updateShift } from "@/lib/db/actions/shifts"
import { createShiftSchema, updateShiftSchema } from "@/lib/db/schemas"
import { readString, type FormState } from "@/lib/forms"

export type ShiftFormState = FormState<"name">

/** Viewing is open to coordinators; mutating stays admin-only as in the legacy UI. */
const handlers = createCrudHandlers({
  path: "/shifts",
  scope: "shift.create",
  role: "admin",
  createSchema: createShiftSchema,
  updateSchema: updateShiftSchema,
  readForm: (formData) => ({ name: readString(formData, "name").trim() }),
  create: createShift,
  update: updateShift,
  remove: removeShift,
  labels: {
    created: "Turno criado.",
    replayed: "Este turno já havia sido criado.",
    updated: "Turno atualizado.",
    deleted: "Turno excluído.",
    invalidId: "Turno inválido.",
    createFailed: "Não foi possível criar o turno.",
    updateFailed: "Não foi possível atualizar o turno.",
    deleteFailed: "Não foi possível excluir o turno.",
  },
})

export async function createShiftAction(
  state: ShiftFormState | undefined,
  formData: FormData,
): Promise<ShiftFormState> {
  return handlers.create(state, formData)
}

export async function updateShiftAction(
  state: ShiftFormState | undefined,
  formData: FormData,
): Promise<ShiftFormState> {
  return handlers.update(state, formData)
}

export async function deleteShiftAction(
  state: ShiftFormState | undefined,
  formData: FormData,
): Promise<ShiftFormState> {
  return handlers.remove(state, formData)
}
