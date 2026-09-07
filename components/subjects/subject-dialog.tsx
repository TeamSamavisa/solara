"use client"

import {
  createSubjectAction,
  updateSubjectAction,
} from "@/app/(authenticated)/subjects/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/shared/form-fields"
import type { SubjectWithRelations } from "@/lib/db/actions/subjects"

export function SubjectDialog({
  subject,
  spaceTypeOptions,
  courseOptions,
  trigger,
}: {
  subject?: SubjectWithRelations
  spaceTypeOptions: SelectOption[]
  courseOptions: SelectOption[]
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(subject)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Disciplina" : "Adicionar Disciplina"}
      description={
        isEditing
          ? "Atualize as informações da disciplina."
          : "Preencha o formulário para adicionar uma disciplina."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateSubjectAction : createSubjectAction}
      hiddenFields={subject ? { id: subject.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <TextField
            {...props}
            name="name"
            label="Nome"
            placeholder="Ex.: Banco de Dados"
            defaultValue={subject?.name}
          />
          <SelectField
            {...props}
            name="required_space_type_id"
            label="Tipo de Espaço"
            placeholder="Selecione um tipo de espaço"
            options={spaceTypeOptions}
            defaultValue={
              subject?.required_space_type_id
                ? String(subject.required_space_type_id)
                : undefined
            }
          />
          <SelectField
            {...props}
            name="course_id"
            label="Curso"
            placeholder="Selecione um curso"
            options={courseOptions}
            defaultValue={
              subject?.course_id ? String(subject.course_id) : undefined
            }
          />
        </>
      )}
    />
  )
}
