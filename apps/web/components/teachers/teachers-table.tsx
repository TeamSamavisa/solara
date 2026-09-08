
import { Truncated } from "@/components/shared/truncated"
import { deleteTeacherAction } from "@/app/(authenticated)/teachers/actions"
import type { AvailabilitySlot } from "@/components/availability/availability-grid"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { TeacherAvailabilityDialog } from "@/components/teachers/teacher-availability-dialog"
import { TeacherDialog } from "@/components/teachers/teacher-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { roleLabel } from "@/lib/auth/roles"
import type { PublicUser } from "@solara/db/schemas"

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
      <p className="py-8 text-center text-sm text-muted-foreground">
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
              <TableCell>
                <Truncated className="max-w-56">{teacher.full_name}</Truncated>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Truncated className="max-w-56">{teacher.email}</Truncated>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Truncated className="max-w-32">
                  {teacher.registration}
                </Truncated>
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
                    trigger={{
                      icon: "availability",
                      ariaLabel: `Disponibilidade de ${teacher.full_name}`,
                    }}
                  />
                  <TeacherDialog
                    teacher={teacher}
                    trigger={{
                      icon: "edit",
                      ariaLabel: `Editar ${teacher.full_name}`,
                    }}
                  />
                  <DeleteDialog
                    id={teacher.id}
                    name={teacher.full_name}
                    entityLabel="o professor"
                    action={deleteTeacherAction}
                    trigger={{
                      icon: "delete",
                      ariaLabel: `Excluir ${teacher.full_name}`,
                    }}
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
