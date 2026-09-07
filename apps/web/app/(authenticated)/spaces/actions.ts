"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import { createSpace, removeSpace, updateSpace } from "@solara/db/actions/spaces"
import { createSpaceSchema, updateSpaceSchema } from "@solara/db/schemas"
import {
  readBoolean,
  readNumber,
  readString,
  type FormState,
} from "@/lib/forms"

export type SpaceFormState = FormState<
  "name" | "floor" | "capacity" | "blocked" | "space_type_id"
>

const handlers = createCrudHandlers({
  path: "/spaces",
  scope: "space.create",
  role: "admin",
  createSchema: createSpaceSchema,
  updateSchema: updateSpaceSchema,
  readForm: (formData) => ({
    name: readString(formData, "name").trim(),
    floor: readNumber(formData, "floor"),
    capacity: readNumber(formData, "capacity"),
    blocked: readBoolean(formData, "blocked"),
    space_type_id: readNumber(formData, "space_type_id"),
  }),
  create: createSpace,
  update: updateSpace,
  remove: removeSpace,
  labels: {
    created: "Espaço criado.",
    replayed: "Este espaço já havia sido criado.",
    updated: "Espaço atualizado.",
    deleted: "Espaço excluído.",
    invalidId: "Espaço inválido.",
    createFailed: "Não foi possível criar o espaço.",
    updateFailed: "Não foi possível atualizar o espaço.",
    deleteFailed: "Não foi possível excluir o espaço.",
  },
})

export async function createSpaceAction(
  state: SpaceFormState | undefined,
  formData: FormData,
): Promise<SpaceFormState> {
  return handlers.create(state, formData)
}

export async function updateSpaceAction(
  state: SpaceFormState | undefined,
  formData: FormData,
): Promise<SpaceFormState> {
  return handlers.update(state, formData)
}

export async function deleteSpaceAction(
  state: SpaceFormState | undefined,
  formData: FormData,
): Promise<SpaceFormState> {
  return handlers.remove(state, formData)
}
