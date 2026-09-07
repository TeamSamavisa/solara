import { PencilIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"

import { deleteAssignmentAction } from "@/app/(authenticated)/assignments/actions"
import { AssignmentDialog } from "@/components/assignments/assignment-dialog"
import type { AvailabilitySlot } from "@/components/availability/availability-grid"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AssignmentWithRelations } from "@/lib/db/actions/assignments"
import { weekdayLabel } from "@/lib/weekdays"

export interface AssignmentOptions {
  teacherOptions: SelectOption[]
  subjectOptions: SelectOption[]
  classGroupOptions: SelectOption[]
  spaceOptions: SelectOption[]
  slots: AvailabilitySlot[]
}

function describe(assignment: AssignmentWithRelations) {
  return `${assignment.subject?.name ?? "Alocação"} · ${
    assignment.classGroup?.name ?? "sem turma"
  }`
}

export function AssignmentsTable({
  assignments,
  options,
  canManage,
}: {
  assignments: AssignmentWithRelations[]
  options: AssignmentOptions
  canManage: boolean
}) {
  if (assignments.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhuma alocação encontrada.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Disciplina</TableHead>
          <TableHead>Turma</TableHead>
          <TableHead>Professor</TableHead>
          <TableHead>Espaço</TableHead>
          <TableHead>Horários</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.id}>
            <TableCell className="flex items-center gap-2">
              {assignment.subject?.name ?? "—"}
              {assignment.violates_availability ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      aria-label="Conflito de disponibilidade"
                    >
                      <TriangleAlertIcon />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    O professor não está disponível em todos os horários, ou o
                    turno não corresponde ao da turma.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {assignment.classGroup?.name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {assignment.teacher?.full_name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {assignment.space?.name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {assignment.schedules.length === 0
                ? "—"
                : assignment.schedules
                    .map(
                      (schedule) =>
                        `${weekdayLabel(schedule.weekday)} ${schedule.start_time}`,
                    )
                    .join(", ")}
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <AssignmentDialog
                  assignment={assignment}
                  {...options}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${describe(assignment)}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={assignment.id}
                  name={describe(assignment)}
                  entityLabel="a alocação"
                  action={deleteAssignmentAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${describe(assignment)}`}
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
