
import { Truncated } from "@/components/shared/truncated"
import { deleteScheduleAction } from "@/app/(authenticated)/schedules/actions"
import { ScheduleDialog } from "@/components/schedules/schedule-dialog"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ScheduleWithShift } from "@solara/db/actions/schedules"
import { weekdayLabel } from "@/lib/weekdays"

function describe(schedule: ScheduleWithShift) {
  return `${weekdayLabel(schedule.weekday)} ${schedule.start_time}-${schedule.end_time}`
}

export function SchedulesTable({
  schedules,
  shiftOptions,
  canManage,
}: {
  schedules: ScheduleWithShift[]
  shiftOptions: SelectOption[]
  canManage: boolean
}) {
  if (schedules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum horário encontrado.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dia</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Término</TableHead>
          <TableHead>Turno</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>{weekdayLabel(schedule.weekday)}</TableCell>
            <TableCell>{schedule.start_time}</TableCell>
            <TableCell>{schedule.end_time}</TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-48">{schedule.shift?.name}</Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <ScheduleDialog
                  schedule={schedule}
                  shiftOptions={shiftOptions}
                  trigger={{
                    icon: "edit",
                    ariaLabel: `Editar ${describe(schedule)}`,
                  }}
                />
                <DeleteDialog
                  id={schedule.id}
                  name={describe(schedule)}
                  entityLabel="o horário"
                  action={deleteScheduleAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${describe(schedule)}`,
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
