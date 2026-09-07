"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import { createUser, removeUser, updateUser } from "@/lib/db/actions/users"
import { createUserSchema, updateUserSchema } from "@/lib/db/schemas"
import {
  readOptionalString,
  readString,
  type FormState,
} from "@/lib/forms"

export type UserFormState = FormState<
  "full_name" | "email" | "registration" | "password" | "role"
>

const handlers = createCrudHandlers({
  path: "/users",
  scope: "user.create",
  role: "admin",
  createSchema: createUserSchema,
  updateSchema: updateUserSchema,
  readForm: (formData) => ({
    full_name: readString(formData, "full_name").trim(),
    email: readString(formData, "email").trim(),
    // Blank means "generate one" on create and "keep the current" on update.
    password: readOptionalString(formData, "password"),
    registration: readOptionalString(formData, "registration"),
    role: readOptionalString(formData, "role"),
  }),
  create: createUser,
  update: updateUser,
  remove: removeUser,
  labels: {
    created: "Usuário criado.",
    replayed: "Este usuário já havia sido criado.",
    updated: "Usuário atualizado.",
    deleted: "Usuário excluído.",
    invalidId: "Usuário inválido.",
    createFailed: "Não foi possível criar o usuário.",
    updateFailed: "Não foi possível atualizar o usuário.",
    deleteFailed: "Não foi possível excluir o usuário.",
  },
})

export async function createUserAction(
  state: UserFormState | undefined,
  formData: FormData,
): Promise<UserFormState> {
  return handlers.create(state, formData)
}

export async function updateUserAction(
  state: UserFormState | undefined,
  formData: FormData,
): Promise<UserFormState> {
  return handlers.update(state, formData)
}

export async function deleteUserAction(
  state: UserFormState | undefined,
  formData: FormData,
): Promise<UserFormState> {
  return handlers.remove(state, formData)
}
