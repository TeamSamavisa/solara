"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createSpaceType,
  removeSpaceType,
  updateSpaceType,
} from "@solara/db/actions/space-types"
import { createSpaceTypeSchema, updateSpaceTypeSchema } from "@solara/db/schemas"
import { readString, type FormState } from "@/lib/forms"

export type SpaceTypeFormState = FormState<"name">

const handlers = createCrudHandlers({
  path: "/space_types",
  scope: "space-type.create",
  role: "admin",
  createSchema: createSpaceTypeSchema,
  updateSchema: updateSpaceTypeSchema,
  readForm: (formData) => ({ name: readString(formData, "name").trim() }),
  create: createSpaceType,
  update: updateSpaceType,
  remove: removeSpaceType,
  labels: {
    created: "Tipo de espaço criado.",
    replayed: "Este tipo de espaço já havia sido criado.",
    updated: "Tipo de espaço atualizado.",
    deleted: "Tipo de espaço excluído.",
    invalidId: "Tipo de espaço inválido.",
    createFailed: "Não foi possível criar o tipo de espaço.",
    updateFailed: "Não foi possível atualizar o tipo de espaço.",
    deleteFailed: "Não foi possível excluir o tipo de espaço.",
  },
})

export async function createSpaceTypeAction(
  state: SpaceTypeFormState | undefined,
  formData: FormData,
): Promise<SpaceTypeFormState> {
  return handlers.create(state, formData)
}

export async function updateSpaceTypeAction(
  state: SpaceTypeFormState | undefined,
  formData: FormData,
): Promise<SpaceTypeFormState> {
  return handlers.update(state, formData)
}

export async function deleteSpaceTypeAction(
  state: SpaceTypeFormState | undefined,
  formData: FormData,
): Promise<SpaceTypeFormState> {
  return handlers.remove(state, formData)
}
