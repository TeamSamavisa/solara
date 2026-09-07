import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteShiftAction } from "@/app/(authenticated)/shifts/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { ShiftDialog } from "@/components/shifts/shift-dialog"
import { Button } from "@/components/ui/button"
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
      <p className="text-muted-foreground py-8 text-center text-sm">
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
            <TableCell>{shift.name}</TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <ShiftDialog
                  shift={shift}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${shift.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={shift.id}
                  name={shift.name}
                  entityLabel="o turno"
                  action={deleteShiftAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${shift.name}`}
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
