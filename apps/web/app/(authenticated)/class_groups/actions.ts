"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createClassGroup,
  removeClassGroup,
  updateClassGroup,
} from "@solara/db/actions/class-groups"
import {
  createClassGroupSchema,
  updateClassGroupSchema,
} from "@solara/db/schemas"
import { readNumber, readString, type FormState } from "@/lib/forms"

export type ClassGroupFormState = FormState<
  "name" | "semester" | "module" | "student_count" | "shift_id" | "course_id"
>

const handlers = createCrudHandlers({
  path: "/class_groups",
  scope: "class-group.create",
  role: "admin",
  createSchema: createClassGroupSchema,
  updateSchema: updateClassGroupSchema,
  readForm: (formData) => ({
    name: readString(formData, "name").trim(),
    semester: readString(formData, "semester").trim(),
    module: readString(formData, "module").trim(),
    student_count: readNumber(formData, "student_count"),
    shift_id: readNumber(formData, "shift_id"),
    course_id: readNumber(formData, "course_id"),
  }),
  create: createClassGroup,
  update: updateClassGroup,
  remove: removeClassGroup,
  labels: {
    created: "Turma criada.",
    replayed: "Esta turma já havia sido criada.",
    updated: "Turma atualizada.",
    deleted: "Turma excluída.",
    invalidId: "Turma inválida.",
    createFailed: "Não foi possível criar a turma.",
    updateFailed: "Não foi possível atualizar a turma.",
    deleteFailed: "Não foi possível excluir a turma.",
  },
})

export async function createClassGroupAction(
  state: ClassGroupFormState | undefined,
  formData: FormData,
): Promise<ClassGroupFormState> {
  return handlers.create(state, formData)
}

export async function updateClassGroupAction(
  state: ClassGroupFormState | undefined,
  formData: FormData,
): Promise<ClassGroupFormState> {
  return handlers.update(state, formData)
}

export async function deleteClassGroupAction(
  state: ClassGroupFormState | undefined,
  formData: FormData,
): Promise<ClassGroupFormState> {
  return handlers.remove(state, formData)
}
