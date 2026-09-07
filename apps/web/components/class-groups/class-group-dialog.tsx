"use client"

import {
  createClassGroupAction,
  updateClassGroupAction,
} from "@/app/(authenticated)/class_groups/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  NumberField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/shared/form-fields"
import type { ClassGroupWithRelations } from "@solara/db/actions/class-groups"

export function ClassGroupDialog({
  classGroup,
  shiftOptions,
  courseOptions,
  trigger,
}: {
  classGroup?: ClassGroupWithRelations
  shiftOptions: SelectOption[]
  courseOptions: SelectOption[]
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(classGroup)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Turma" : "Adicionar Turma"}
      description={
        isEditing
          ? "Atualize as informações da turma."
          : "Preencha o formulário para adicionar uma turma."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateClassGroupAction : createClassGroupAction}
      hiddenFields={classGroup ? { id: classGroup.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <TextField
            {...props}
            name="name"
            label="Nome"
            placeholder="Ex.: Turma ADS Módulo 1"
            defaultValue={classGroup?.name}
          />
          <TextField
            {...props}
            name="semester"
            label="Semestre"
            placeholder="Ex.: 1º semestre"
            defaultValue={classGroup?.semester}
          />
          <TextField
            {...props}
            name="module"
            label="Módulo"
            placeholder="Ex.: Módulo 1"
            defaultValue={classGroup?.module}
          />
          <NumberField
            {...props}
            name="student_count"
            label="Nº de alunos"
            placeholder="Ex.: 40"
            min={1}
            defaultValue={classGroup?.student_count}
          />
          <SelectField
            {...props}
            name="shift_id"
            label="Turno"
            placeholder="Selecione um turno"
            options={shiftOptions}
            defaultValue={
              classGroup?.shift_id ? String(classGroup.shift_id) : undefined
            }
          />
          <SelectField
            {...props}
            name="course_id"
            label="Curso"
            placeholder="Selecione um curso"
            options={courseOptions}
            defaultValue={
              classGroup?.course_id ? String(classGroup.course_id) : undefined
            }
          />
        </>
      )}
    />
  )
}
