"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import { sendFirstAccessInstructions } from "@/lib/mail/first-access"
import { createUser, removeUser, updateUser } from "@solara/db/actions/users"
import { createUserSchema, updateUserSchema } from "@solara/db/schemas"
import { readOptionalString, readString, type FormState } from "@/lib/forms"

export type UserFormState = FormState<
  "full_name" | "email" | "registration" | "password" | "role"
>

const handlers = createCrudHandlers({
  path: "/users",
  scope: "user.create",
  role: "admin",
  createSchema: createUserSchema,
  updateSchema: updateUserSchema,
  readForm: (formData, mode) => ({
    full_name: readString(formData, "full_name").trim(),
    email: readString(formData, "email").trim(),
    // The administrator never picks the first password: the user defines it
    // through the first-access e-mail. On update, blank keeps the current one.
    ...(mode === "update"
      ? { password: readOptionalString(formData, "password") }
      : {}),
    registration: readOptionalString(formData, "registration"),
    role: readOptionalString(formData, "role"),
  }),
  create: createUser,
  onCreated: sendFirstAccessInstructions,
  update: updateUser,
  remove: removeUser,
  labels: {
    created: "Usuário criado.",
    replayed: "Este usuário já havia sido criado.",
    updated: "Usuário atualizado.",
    deleted: "Usuário excluído.",
    invalidId: "Usuário inválido.",
    createFailed: "Não foi possível criar o usuário.",
    createIncomplete:
      "Usuário criado, mas não foi possível enviar o e-mail de primeiro acesso.",
    updateFailed: "Não foi possível atualizar o usuário.",
    deleteFailed: "Não foi possível excluir o usuário.",
  },
})

export async function createUserAction(
  state: UserFormState | undefined,
  formData: FormData
): Promise<UserFormState> {
  return handlers.create(state, formData)
}

export async function updateUserAction(
  state: UserFormState | undefined,
  formData: FormData
): Promise<UserFormState> {
  return handlers.update(state, formData)
}

export async function deleteUserAction(
  state: UserFormState | undefined,
  formData: FormData
): Promise<UserFormState> {
  return handlers.remove(state, formData)
}
