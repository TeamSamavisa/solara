"use client"

import {
  createScheduleAction,
  updateScheduleAction,
} from "@/app/(authenticated)/schedules/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/shared/form-fields"
import type { ScheduleWithShift } from "@/lib/db/actions/schedules"
import { WEEKDAYS } from "@/lib/weekdays"

const WEEKDAY_OPTIONS: SelectOption[] = WEEKDAYS.map((weekday) => ({
  value: weekday.value,
  label: weekday.label,
}))

export function ScheduleDialog({
  schedule,
  shiftOptions,
  trigger,
}: {
  schedule?: ScheduleWithShift
  shiftOptions: SelectOption[]
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(schedule)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Horário" : "Adicionar Horário"}
      description={
        isEditing
          ? "Atualize as informações do horário."
          : "Preencha o formulário para adicionar um horário."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateScheduleAction : createScheduleAction}
      hiddenFields={schedule ? { id: schedule.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <SelectField
            {...props}
            name="weekday"
            label="Dia da semana"
            options={WEEKDAY_OPTIONS}
            defaultValue={schedule?.weekday}
          />
          <TextField
            {...props}
            name="start_time"
            label="Início"
            placeholder="HH:MM"
            defaultValue={schedule?.start_time}
          />
          <TextField
            {...props}
            name="end_time"
            label="Término"
            placeholder="HH:MM"
            defaultValue={schedule?.end_time}
          />
          <SelectField
            {...props}
            name="shift_id"
            label="Turno"
            placeholder="Selecione um turno"
            options={shiftOptions}
            defaultValue={
              schedule?.shift_id ? String(schedule.shift_id) : undefined
            }
          />
        </>
      )}
    />
  )
}
