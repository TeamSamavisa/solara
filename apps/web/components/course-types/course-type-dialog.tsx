"use client"

import {
  createCourseTypeAction,
  updateCourseTypeAction,
} from "@/app/(authenticated)/course-types/actions"
import type { DialogTriggerSpec } from "@/components/shared/dialog-trigger"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { TextField } from "@/components/shared/form-fields"
import type { CourseType } from "@solara/db/schemas"

export function CourseTypeDialog({
  courseType,
  trigger,
}: {
  courseType?: CourseType
  trigger: DialogTriggerSpec
}) {
  const isEditing = Boolean(courseType)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Tipo de Curso" : "Adicionar Tipo de Curso"}
      description={
        isEditing
          ? "Atualize as informações do tipo de curso."
          : "Preencha o formulário para adicionar um tipo de curso."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateCourseTypeAction : createCourseTypeAction}
      hiddenFields={courseType ? { id: courseType.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <TextField
          {...props}
          name="name"
          label="Nome"
          placeholder="Ex.: Tecnólogo"
          defaultValue={courseType?.name}
        />
      )}
    />
  )
}
