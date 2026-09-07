"use server"

import { createCrudHandlers } from "@/lib/crud-actions"
import {
  createSchedule,
  removeSchedule,
  updateSchedule,
} from "@solara/db/actions/schedules"
import { createScheduleSchema, updateScheduleSchema } from "@solara/db/schemas"
import { readNumber, readString, type FormState } from "@/lib/forms"

export type ScheduleFormState = FormState<
  "weekday" | "start_time" | "end_time" | "shift_id"
>

const handlers = createCrudHandlers({
  path: "/schedules",
  scope: "schedule.create",
  role: "admin",
  createSchema: createScheduleSchema,
  updateSchema: updateScheduleSchema,
  readForm: (formData) => ({
    weekday: readString(formData, "weekday").trim(),
    start_time: readString(formData, "start_time").trim(),
    end_time: readString(formData, "end_time").trim(),
    shift_id: readNumber(formData, "shift_id"),
  }),
  create: createSchedule,
  update: updateSchedule,
  remove: removeSchedule,
  labels: {
    created: "Horário criado.",
    replayed: "Este horário já havia sido criado.",
    updated: "Horário atualizado.",
    deleted: "Horário excluído.",
    invalidId: "Horário inválido.",
    createFailed: "Não foi possível criar o horário.",
    updateFailed: "Não foi possível atualizar o horário.",
    deleteFailed: "Não foi possível excluir o horário.",
  },
})

export async function createScheduleAction(
  state: ScheduleFormState | undefined,
  formData: FormData,
): Promise<ScheduleFormState> {
  return handlers.create(state, formData)
}

export async function updateScheduleAction(
  state: ScheduleFormState | undefined,
  formData: FormData,
): Promise<ScheduleFormState> {
  return handlers.update(state, formData)
}

export async function deleteScheduleAction(
  state: ScheduleFormState | undefined,
  formData: FormData,
): Promise<ScheduleFormState> {
  return handlers.remove(state, formData)
}
