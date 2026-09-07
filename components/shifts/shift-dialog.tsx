"use client"

import {
  createShiftAction,
  updateShiftAction,
} from "@/app/(authenticated)/shifts/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { TextField } from "@/components/shared/form-fields"
import type { Shift } from "@/lib/db/schemas"

export function ShiftDialog({
  shift,
  trigger,
}: {
  shift?: Shift
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(shift)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Turno" : "Adicionar Turno"}
      description={
        isEditing
          ? "Atualize as informações do turno."
          : "Preencha o formulário para adicionar um turno."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateShiftAction : createShiftAction}
      hiddenFields={shift ? { id: shift.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <TextField
          {...props}
          name="name"
          label="Nome"
          placeholder="Ex.: Matutino"
          defaultValue={shift?.name}
        />
      )}
    />
  )
}
