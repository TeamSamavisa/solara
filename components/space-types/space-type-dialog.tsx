"use client"

import {
  createSpaceTypeAction,
  updateSpaceTypeAction,
} from "@/app/(authenticated)/space_types/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { TextField } from "@/components/shared/form-fields"
import type { SpaceType } from "@/lib/db/schemas"

export function SpaceTypeDialog({
  spaceType,
  trigger,
}: {
  spaceType?: SpaceType
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(spaceType)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Tipo de Espaço" : "Adicionar Tipo de Espaço"}
      description={
        isEditing
          ? "Atualize as informações do tipo de espaço."
          : "Preencha o formulário para adicionar um tipo de espaço."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateSpaceTypeAction : createSpaceTypeAction}
      hiddenFields={spaceType ? { id: spaceType.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <TextField
          {...props}
          name="name"
          label="Nome"
          placeholder="Ex.: Laboratório"
          defaultValue={spaceType?.name}
        />
      )}
    />
  )
}
