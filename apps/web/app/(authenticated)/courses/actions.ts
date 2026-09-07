"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createCourse,
  removeCourse,
  updateCourse,
} from "@solara/db/actions/courses"
import { createCourseSchema, updateCourseSchema } from "@solara/db/schemas"
import { readNumber, readString, type FormState } from "@/lib/forms"

export type CourseFormState = FormState<"name" | "course_type_id">

const handlers = createCrudHandlers({
  path: "/courses",
  scope: "course.create",
  role: "admin",
  createSchema: createCourseSchema,
  updateSchema: updateCourseSchema,
  readForm: (formData) => ({
    name: readString(formData, "name").trim(),
    course_type_id: readNumber(formData, "course_type_id"),
  }),
  create: createCourse,
  update: updateCourse,
  remove: removeCourse,
  labels: {
    created: "Curso criado.",
    replayed: "Este curso já havia sido criado.",
    updated: "Curso atualizado.",
    deleted: "Curso excluído.",
    invalidId: "Curso inválido.",
    createFailed: "Não foi possível criar o curso.",
    updateFailed: "Não foi possível atualizar o curso.",
    deleteFailed: "Não foi possível excluir o curso.",
  },
})

export async function createCourseAction(
  state: CourseFormState | undefined,
  formData: FormData,
): Promise<CourseFormState> {
  return handlers.create(state, formData)
}

export async function updateCourseAction(
  state: CourseFormState | undefined,
  formData: FormData,
): Promise<CourseFormState> {
  return handlers.update(state, formData)
}

export async function deleteCourseAction(
  state: CourseFormState | undefined,
  formData: FormData,
): Promise<CourseFormState> {
  return handlers.remove(state, formData)
}
