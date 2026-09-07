import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteSpaceAction } from "@/app/(authenticated)/spaces/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
import { SpaceDialog } from "@/components/spaces/space-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SpaceWithType } from "@/lib/db/actions/spaces"

export function SpacesTable({
  spaces,
  spaceTypeOptions,
  canManage,
}: {
  spaces: SpaceWithType[]
  spaceTypeOptions: SelectOption[]
  canManage: boolean
}) {
  if (spaces.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum espaço encontrado.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Andar</TableHead>
          <TableHead>Capacidade</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Situação</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {spaces.map((space) => (
          <TableRow key={space.id}>
            <TableCell>{space.name}</TableCell>
            <TableCell>{space.floor}</TableCell>
            <TableCell>{space.capacity}</TableCell>
            <TableCell className="text-muted-foreground">
              {space.spaceType?.name ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant={space.blocked ? "destructive" : "secondary"}>
                {space.blocked ? "Bloqueado" : "Disponível"}
              </Badge>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <SpaceDialog
                  space={space}
                  spaceTypeOptions={spaceTypeOptions}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${space.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={space.id}
                  name={space.name}
                  entityLabel="o espaço"
                  action={deleteSpaceAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${space.name}`}
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
