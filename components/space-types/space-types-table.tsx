import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteSpaceTypeAction } from "@/app/(authenticated)/space_types/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { SpaceTypeDialog } from "@/components/space-types/space-type-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SpaceType } from "@/lib/db/schemas"

export function SpaceTypesTable({
  spaceTypes,
  canManage,
}: {
  spaceTypes: SpaceType[]
  canManage: boolean
}) {
  if (spaceTypes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum tipo de espaço encontrado.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {spaceTypes.map((spaceType) => (
          <TableRow key={spaceType.id}>
            <TableCell>{spaceType.name}</TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <SpaceTypeDialog
                  spaceType={spaceType}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${spaceType.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={spaceType.id}
                  name={spaceType.name}
                  entityLabel="o tipo de espaço"
                  action={deleteSpaceTypeAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${spaceType.name}`}
                    >
                      <Trash2Icon />
                    </Button>
                  }
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
