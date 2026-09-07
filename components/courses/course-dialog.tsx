"use client"

import {
  createCourseAction,
  updateCourseAction,
} from "@/app/(authenticated)/courses/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/shared/form-fields"
import type { CourseWithType } from "@/lib/db/actions/courses"

export function CourseDialog({
  course,
  courseTypeOptions,
  trigger,
}: {
  course?: CourseWithType
  courseTypeOptions: SelectOption[]
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(course)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Curso" : "Adicionar Curso"}
      description={
        isEditing
          ? "Atualize as informações do curso."
          : "Preencha o formulário para adicionar um curso."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateCourseAction : createCourseAction}
      hiddenFields={course ? { id: course.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <TextField
            {...props}
            name="name"
            label="Nome"
            placeholder="Ex.: Informática"
            defaultValue={course?.name}
          />
          <SelectField
            {...props}
            name="course_type_id"
            label="Tipo de Curso"
            placeholder="Selecione um tipo de curso"
            options={courseTypeOptions}
            defaultValue={
              course?.course_type_id
                ? String(course.course_type_id)
                : undefined
            }
          />
        </>
      )}
    />
  )
}
