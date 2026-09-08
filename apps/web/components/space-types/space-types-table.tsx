
import { Truncated } from "@/components/shared/truncated"
import { deleteSpaceTypeAction } from "@/app/(authenticated)/space_types/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { SpaceTypeDialog } from "@/components/space-types/space-type-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SpaceType } from "@solara/db/schemas"

export function SpaceTypesTable({
  spaceTypes,
  canManage,
}: {
  spaceTypes: SpaceType[]
  canManage: boolean
}) {
  if (spaceTypes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
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
            <TableCell>
              <Truncated className="max-w-64">{spaceType.name}</Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <SpaceTypeDialog
                  spaceType={spaceType}
                  trigger={{
                    icon: "edit",
                    ariaLabel: `Editar ${spaceType.name}`,
                  }}
                />
                <DeleteDialog
                  id={spaceType.id}
                  name={spaceType.name}
                  entityLabel="o tipo de espaço"
                  action={deleteSpaceTypeAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${spaceType.name}`,
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
