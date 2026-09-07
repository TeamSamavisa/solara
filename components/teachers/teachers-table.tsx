import { CalendarClockIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { deleteTeacherAction } from "@/app/(authenticated)/teachers/actions"
import type { AvailabilitySlot } from "@/components/availability/availability-grid"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { TeacherAvailabilityDialog } from "@/components/teachers/teacher-availability-dialog"
import { TeacherDialog } from "@/components/teachers/teacher-dialog"
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
import { roleLabel } from "@/lib/auth/roles"
import type { PublicUser } from "@/lib/db/schemas"

export function TeachersTable({
  teachers,
  slots,
  availabilityByTeacher,
  canManage,
}: {
  teachers: PublicUser[]
  slots: AvailabilitySlot[]
  availabilityByTeacher: Record<number, number[]>
  canManage: boolean
}) {
  if (teachers.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum professor encontrado.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Matrícula</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Horários</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teachers.map((teacher) => {
          const availability = availabilityByTeacher[teacher.id] ?? []

          return (
            <TableRow key={teacher.id}>
              <TableCell>{teacher.full_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {teacher.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {teacher.registration ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{roleLabel(teacher.role)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {availability.length}
              </TableCell>
              {canManage ? (
                <TableCell className="flex justify-end gap-2">
                  <TeacherAvailabilityDialog
                    teacherId={teacher.id}
                    teacherName={teacher.full_name}
                    slots={slots}
                    selectedScheduleIds={availability}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Disponibilidade de ${teacher.full_name}`}
                      >
                        <CalendarClockIcon />
                      </Button>
                    }
                  />
                  <TeacherDialog
                    teacher={teacher}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${teacher.full_name}`}
                      >
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <DeleteDialog
                    id={teacher.id}
                    name={teacher.full_name}
                    entityLabel="o professor"
                    action={deleteTeacherAction}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${teacher.full_name}`}
                      >
                        <Trash2Icon />
                      </Button>
                    }
                  />
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
