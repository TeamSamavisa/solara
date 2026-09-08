
import { Truncated } from "@/components/shared/truncated"
import { deleteShiftAction } from "@/app/(authenticated)/shifts/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { ShiftDialog } from "@/components/shifts/shift-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Shift } from "@solara/db/schemas"

export function ShiftsTable({
  shifts,
  canManage,
}: {
  shifts: Shift[]
  canManage: boolean
}) {
  if (shifts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum turno encontrado.
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
        {shifts.map((shift) => (
          <TableRow key={shift.id}>
            <TableCell>
              <Truncated className="max-w-64">{shift.name}</Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <ShiftDialog
                  shift={shift}
                  trigger={{ icon: "edit", ariaLabel: `Editar ${shift.name}` }}
                />
                <DeleteDialog
                  id={shift.id}
                  name={shift.name}
                  entityLabel="o turno"
                  action={deleteShiftAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${shift.name}`,
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
