"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createSubject,
  removeSubject,
  updateSubject,
} from "@solara/db/actions/subjects"
import { createSubjectSchema, updateSubjectSchema } from "@solara/db/schemas"
import { readNumber, readString, type FormState } from "@/lib/forms"

export type SubjectFormState = FormState<
  "name" | "required_space_type_id" | "course_id"
>

const handlers = createCrudHandlers({
  path: "/subjects",
  scope: "subject.create",
  role: "admin",
  createSchema: createSubjectSchema,
  updateSchema: updateSubjectSchema,
  readForm: (formData) => ({
    name: readString(formData, "name").trim(),
    required_space_type_id: readNumber(formData, "required_space_type_id"),
    course_id: readNumber(formData, "course_id"),
  }),
  create: createSubject,
  update: updateSubject,
  remove: removeSubject,
  labels: {
    created: "Disciplina criada.",
    replayed: "Esta disciplina já havia sido criada.",
    updated: "Disciplina atualizada.",
    deleted: "Disciplina excluída.",
    invalidId: "Disciplina inválida.",
    createFailed: "Não foi possível criar a disciplina.",
    updateFailed: "Não foi possível atualizar a disciplina.",
    deleteFailed: "Não foi possível excluir a disciplina.",
  },
})

export async function createSubjectAction(
  state: SubjectFormState | undefined,
  formData: FormData,
): Promise<SubjectFormState> {
  return handlers.create(state, formData)
}

export async function updateSubjectAction(
  state: SubjectFormState | undefined,
  formData: FormData,
): Promise<SubjectFormState> {
  return handlers.update(state, formData)
}

export async function deleteSubjectAction(
  state: SubjectFormState | undefined,
  formData: FormData,
): Promise<SubjectFormState> {
  return handlers.remove(state, formData)
}
