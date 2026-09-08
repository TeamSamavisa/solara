"use client"

import {
  createAssignmentAction,
  updateAssignmentAction,
} from "@/app/(authenticated)/assignments/actions"
import type { DialogTriggerSpec } from "@/components/shared/dialog-trigger"
import type { AvailabilitySlot } from "@/components/availability/availability-grid"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  NumberField,
  SelectField,
  type SelectOption,
} from "@/components/shared/form-fields"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { AssignmentWithRelations } from "@solara/db/actions/assignments"
import { weekdayLabel } from "@/lib/weekdays"

export function AssignmentDialog({
  assignment,
  teacherOptions,
  subjectOptions,
  classGroupOptions,
  spaceOptions,
  slots,
  trigger,
}: {
  assignment?: AssignmentWithRelations
  teacherOptions: SelectOption[]
  subjectOptions: SelectOption[]
  classGroupOptions: SelectOption[]
  spaceOptions: SelectOption[]
  slots: AvailabilitySlot[]
  trigger: DialogTriggerSpec
}) {
  const isEditing = Boolean(assignment)
  const selected = new Set(
    assignment?.schedules.map((schedule) => schedule.id) ?? []
  )

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Alocação" : "Adicionar Alocação"}
      description={
        isEditing
          ? "Atualize as informações da alocação."
          : "Preencha o formulário para adicionar uma alocação."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateAssignmentAction : createAssignmentAction}
      hiddenFields={assignment ? { id: assignment.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <SelectField
            {...props}
            name="teacher_id"
            label="Professor"
            placeholder="Selecione um professor"
            options={teacherOptions}
            defaultValue={
              assignment?.teacher_id ? String(assignment.teacher_id) : undefined
            }
          />
          <SelectField
            {...props}
            name="subject_id"
            label="Disciplina"
            placeholder="Selecione uma disciplina"
            options={subjectOptions}
            defaultValue={
              assignment?.subject_id ? String(assignment.subject_id) : undefined
            }
          />
          <SelectField
            {...props}
            name="class_group_id"
            label="Turma"
            placeholder="Selecione uma turma"
            options={classGroupOptions}
            defaultValue={
              assignment?.class_group_id
                ? String(assignment.class_group_id)
                : undefined
            }
          />
          <SelectField
            {...props}
            name="space_id"
            label="Espaço"
            placeholder="Selecione um espaço (opcional)"
            options={spaceOptions}
            required={false}
            defaultValue={
              assignment?.space_id ? String(assignment.space_id) : undefined
            }
          />
          <NumberField
            {...props}
            name="duration"
            label="Duração (aulas)"
            placeholder="2"
            min={1}
            required={false}
            defaultValue={assignment?.duration}
          />

          <Field data-invalid={props.isInvalid("schedule_ids") || undefined}>
            <FieldLabel>Horários</FieldLabel>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-none border p-3">
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário cadastrado.
                </p>
              ) : (
                slots.map((slot) => (
                  <label
                    key={slot.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      name="schedule_ids"
                      value={String(slot.id)}
                      defaultChecked={selected.has(slot.id)}
                      disabled={props.pending}
                    />
                    {weekdayLabel(slot.weekday)} · {slot.start_time}–
                    {slot.end_time}
                  </label>
                ))
              )}
            </div>
            <FieldError errors={props.errorsFor("schedule_ids")} />
          </Field>
        </>
      )}
    />
  )
}
