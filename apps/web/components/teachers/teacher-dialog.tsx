"use client"

import {
  createTeacherAction,
  updateTeacherAction,
} from "@/app/(authenticated)/teachers/actions"
import type { DialogTriggerSpec } from "@/components/shared/dialog-trigger"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { TextField } from "@/components/shared/form-fields"
import type { PublicUser } from "@solara/db/schemas"

export function TeacherDialog({
  teacher,
  trigger,
}: {
  teacher?: PublicUser
  trigger: DialogTriggerSpec
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
          {isEditing ? (
            <TextField
              {...props}
              name="password"
              label="Nova senha"
              placeholder="Deixe em branco para manter"
              required={false}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              O professor receberá um e-mail com instruções para validar a conta
              e definir a senha de acesso.
            </p>
          )}
        </>
      )}
    />
  )
}
