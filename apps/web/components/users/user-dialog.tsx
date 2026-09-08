"use client"

import {
  createUserAction,
  updateUserAction,
} from "@/app/(authenticated)/users/actions"
import type { DialogTriggerSpec } from "@/components/shared/dialog-trigger"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/shared/form-fields"
import { ROLE_LABELS, ROLES } from "@/lib/auth/roles"
import type { PublicUser } from "@solara/db/schemas"

const ROLE_OPTIONS: SelectOption[] = ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

export function UserDialog({
  user,
  trigger,
}: {
  user?: PublicUser
  trigger: DialogTriggerSpec
}) {
  const isEditing = Boolean(user)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Usuário" : "Adicionar Usuário"}
      description={
        isEditing
          ? "Atualize as informações do usuário."
          : "Preencha o formulário para adicionar um usuário."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateUserAction : createUserAction}
      hiddenFields={user ? { id: user.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <TextField
            {...props}
            name="full_name"
            label="Nome completo"
            placeholder="Ex.: Ana Souza"
            defaultValue={user?.full_name}
          />
          <TextField
            {...props}
            name="email"
            label="E-mail"
            placeholder="nome@exemplo.com"
            defaultValue={user?.email}
          />
          <TextField
            {...props}
            name="registration"
            label="Matrícula"
            placeholder="Somente números"
            defaultValue={user?.registration ?? ""}
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
          <SelectField
            {...props}
            name="role"
            label="Cargo"
            placeholder="Selecione um cargo"
            options={ROLE_OPTIONS}
            defaultValue={user?.role ?? "teacher"}
          />
        </>
      )}
    />
  )
}
