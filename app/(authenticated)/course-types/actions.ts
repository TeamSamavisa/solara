"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createCourseType,
  removeCourseType,
  updateCourseType,
} from "@/lib/db/actions/course-types"
import {
  createCourseTypeSchema,
  updateCourseTypeSchema,
} from "@/lib/db/schemas"
import { readString, type FormState } from "@/lib/forms"

export type CourseTypeFormState = FormState<"name">

const handlers = createCrudHandlers({
  path: "/course-types",
  scope: "course-type.create",
  role: "admin",
  createSchema: createCourseTypeSchema,
  updateSchema: updateCourseTypeSchema,
  readForm: (formData) => ({ name: readString(formData, "name").trim() }),
  create: createCourseType,
  update: updateCourseType,
  remove: removeCourseType,
  labels: {
    created: "Tipo de curso criado.",
    replayed: "Este tipo de curso já havia sido criado.",
    updated: "Tipo de curso atualizado.",
    deleted: "Tipo de curso excluído.",
    invalidId: "Tipo de curso inválido.",
    createFailed: "Não foi possível criar o tipo de curso.",
    updateFailed: "Não foi possível atualizar o tipo de curso.",
    deleteFailed: "Não foi possível excluir o tipo de curso.",
  },
})

export async function createCourseTypeAction(
  state: CourseTypeFormState | undefined,
  formData: FormData,
): Promise<CourseTypeFormState> {
  return handlers.create(state, formData)
}

export async function updateCourseTypeAction(
  state: CourseTypeFormState | undefined,
  formData: FormData,
): Promise<CourseTypeFormState> {
  return handlers.update(state, formData)
}

export async function deleteCourseTypeAction(
  state: CourseTypeFormState | undefined,
  formData: FormData,
): Promise<CourseTypeFormState> {
  return handlers.remove(state, formData)
}
