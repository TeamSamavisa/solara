"use client"

import {
  createSpaceAction,
  updateSpaceAction,
} from "@/app/(authenticated)/spaces/actions"
import { EntityDialog } from "@/components/shared/entity-dialog"
import {
  NumberField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/shared/form-fields"
import type { SpaceWithType } from "@/lib/db/actions/spaces"

const BLOCKED_OPTIONS: SelectOption[] = [
  { value: "false", label: "Não" },
  { value: "true", label: "Sim" },
]

export function SpaceDialog({
  space,
  spaceTypeOptions,
  trigger,
}: {
  space?: SpaceWithType
  spaceTypeOptions: SelectOption[]
  trigger: React.ReactNode
}) {
  const isEditing = Boolean(space)

  return (
    <EntityDialog
      trigger={trigger}
      title={isEditing ? "Editar Espaço" : "Adicionar Espaço"}
      description={
        isEditing
          ? "Atualize as informações do espaço."
          : "Preencha o formulário para adicionar um espaço."
      }
      submitLabel={isEditing ? "Salvar" : "Adicionar"}
      action={isEditing ? updateSpaceAction : createSpaceAction}
      hiddenFields={space ? { id: space.id } : undefined}
      withIdempotencyKey={!isEditing}
      renderFields={(props) => (
        <>
          <TextField
            {...props}
            name="name"
            label="Nome"
            placeholder="Ex.: Lab 1"
            defaultValue={space?.name}
          />
          <NumberField
            {...props}
            name="floor"
            label="Andar"
            placeholder="Ex.: 1"
            defaultValue={space?.floor}
          />
          <NumberField
            {...props}
            name="capacity"
            label="Capacidade"
            placeholder="Ex.: 40"
            min={1}
            defaultValue={space?.capacity}
          />
          <SelectField
            {...props}
            name="blocked"
            label="Bloqueado?"
            options={BLOCKED_OPTIONS}
            defaultValue={space?.blocked ? "true" : "false"}
          />
          <SelectField
            {...props}
            name="space_type_id"
            label="Tipo de Espaço"
            placeholder="Selecione um tipo de espaço"
            options={spaceTypeOptions}
            defaultValue={
              space?.space_type_id ? String(space.space_type_id) : undefined
            }
          />
        </>
      )}
    />
  )
}
