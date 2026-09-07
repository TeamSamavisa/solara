"use client"

import {
  createTeacherAction,
  updateTeacherAction,
} from "@/app/(authenticated)/teachers/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { TextField } from "@/components/shared/form-fields"
import type { PublicUser } from "@/lib/db/schemas"

export function TeacherDialog({
  teacher,
  trigger,
}: {
  teacher?: PublicUser
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(teacher)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Professor" : "Adicionar Professor"}
      description={
        isEditing
          ? "Atualize as informações do professor."
          : "Preencha o formulário para adicionar um professor."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateTeacherAction : createTeacherAction}
      hiddenFields={teacher ? { id: teacher.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <TextField
            {...props}
            name="full_name"
            label="Nome completo"
            placeholder="Ex.: Ana Souza"
            defaultValue={teacher?.full_name}
          />
          <TextField
            {...props}
            name="email"
            label="E-mail"
            placeholder="nome@exemplo.com"
            defaultValue={teacher?.email}
          />
          <TextField
            {...props}
            name="registration"
            label="Matrícula"
            placeholder="Somente números"
            defaultValue={teacher?.registration ?? ""}
            required={false}
          />
          <TextField
            {...props}
            name="password"
            label={isEditing ? "Nova senha" : "Senha"}
            placeholder={
              isEditing
                ? "Deixe em branco para manter"
                : "Deixe em branco para gerar automaticamente"
            }
            required={false}
          />
        </>
      )}
    />
  )
}
