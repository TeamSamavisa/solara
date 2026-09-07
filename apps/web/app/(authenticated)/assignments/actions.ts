"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createAssignment,
  removeAssignment,
  updateAssignment,
} from "@solara/db/actions/assignments"
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "@solara/db/schemas"
import {
  readNumber,
  readNumberArray,
  readOptionalNumber,
  type FormState,
} from "@/lib/forms"

export type AssignmentFormState = FormState<
  | "teacher_id"
  | "subject_id"
  | "class_group_id"
  | "space_id"
  | "duration"
  | "schedule_ids"
>

const handlers = createCrudHandlers({
  path: "/assignments",
  scope: "assignment.create",
  role: "admin",
  createSchema: createAssignmentSchema,
  updateSchema: updateAssignmentSchema,
  readForm: (formData) => ({
    teacher_id: readNumber(formData, "teacher_id"),
    subject_id: readNumber(formData, "subject_id"),
    class_group_id: readNumber(formData, "class_group_id"),
    space_id: readOptionalNumber(formData, "space_id"),
    duration: readOptionalNumber(formData, "duration"),
    schedule_ids: readNumberArray(formData, "schedule_ids"),
  }),
  create: createAssignment,
  update: updateAssignment,
  remove: removeAssignment,
  labels: {
    created: "Alocação criada.",
    replayed: "Esta alocação já havia sido criada.",
    updated: "Alocação atualizada.",
    deleted: "Alocação excluída.",
    invalidId: "Alocação inválida.",
    createFailed: "Não foi possível criar a alocação.",
    updateFailed: "Não foi possível atualizar a alocação.",
    deleteFailed: "Não foi possível excluir a alocação.",
  },
})

export async function createAssignmentAction(
  state: AssignmentFormState | undefined,
  formData: FormData,
): Promise<AssignmentFormState> {
  return handlers.create(state, formData)
}

export async function updateAssignmentAction(
  state: AssignmentFormState | undefined,
  formData: FormData,
): Promise<AssignmentFormState> {
  return handlers.update(state, formData)
}

export async function deleteAssignmentAction(
  state: AssignmentFormState | undefined,
  formData: FormData,
): Promise<AssignmentFormState> {
  return handlers.remove(state, formData)
}
