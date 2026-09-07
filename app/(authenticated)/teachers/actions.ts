"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import { createUser, removeUser, updateUser } from "@/lib/db/actions/users"
import { createUserSchema, updateUserSchema } from "@/lib/db/schemas"
import { readOptionalString, readString, type FormState } from "@/lib/forms"

export type TeacherFormState = FormState<
  "full_name" | "email" | "registration" | "password"
>

const handlers = createCrudHandlers({
  path: "/teachers",
  scope: "teacher.create",
  role: "admin",
  createSchema: createUserSchema,
  updateSchema: updateUserSchema,
  readForm: (formData, mode) => ({
    full_name: readString(formData, "full_name").trim(),
    email: readString(formData, "email").trim(),
    password: readOptionalString(formData, "password"),
    registration: readOptionalString(formData, "registration"),
    // New staff start as teachers. On update the role is left out entirely so
    // a coordinator listed here is never silently demoted.
    ...(mode === "create" ? { role: "teacher" } : {}),
  }),
  create: createUser,
  update: updateUser,
  remove: removeUser,
  labels: {
    created: "Professor criado.",
    replayed: "Este professor já havia sido criado.",
    updated: "Professor atualizado.",
    deleted: "Professor excluído.",
    invalidId: "Professor inválido.",
    createFailed: "Não foi possível criar o professor.",
    updateFailed: "Não foi possível atualizar o professor.",
    deleteFailed: "Não foi possível excluir o professor.",
  },
})

export async function createTeacherAction(
  state: TeacherFormState | undefined,
  formData: FormData,
): Promise<TeacherFormState> {
  return handlers.create(state, formData)
}

export async function updateTeacherAction(
  state: TeacherFormState | undefined,
  formData: FormData,
): Promise<TeacherFormState> {
  return handlers.update(state, formData)
}

export async function deleteTeacherAction(
  state: TeacherFormState | undefined,
  formData: FormData,
): Promise<TeacherFormState> {
  return handlers.remove(state, formData)
}
