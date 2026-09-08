
import { Truncated } from "@/components/shared/truncated"
import { deleteSpaceAction } from "@/app/(authenticated)/spaces/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
import { SpaceDialog } from "@/components/spaces/space-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SpaceWithType } from "@solara/db/actions/spaces"

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
      <p className="py-8 text-center text-sm text-muted-foreground">
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
            <TableCell>
              <Truncated className="max-w-64">{space.name}</Truncated>
            </TableCell>
            <TableCell>{space.floor}</TableCell>
            <TableCell>{space.capacity}</TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-48">
                {space.spaceType?.name}
              </Truncated>
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
                  trigger={{ icon: "edit", ariaLabel: `Editar ${space.name}` }}
                />
                <DeleteDialog
                  id={space.id}
                  name={space.name}
                  entityLabel="o espaço"
                  action={deleteSpaceAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${space.name}`,
                  }}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
