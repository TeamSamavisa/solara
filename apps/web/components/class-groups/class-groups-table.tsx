
import { Truncated } from "@/components/shared/truncated"
import { deleteClassGroupAction } from "@/app/(authenticated)/class_groups/actions"
import { ClassGroupDialog } from "@/components/class-groups/class-group-dialog"
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
import type { ClassGroupWithRelations } from "@solara/db/actions/class-groups"

export function ClassGroupsTable({
  classGroups,
  shiftOptions,
  courseOptions,
  canManage,
}: {
  classGroups: ClassGroupWithRelations[]
  shiftOptions: SelectOption[]
  courseOptions: SelectOption[]
  canManage: boolean
}) {
  if (classGroups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma turma encontrada.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Semestre</TableHead>
          <TableHead>Módulo</TableHead>
          <TableHead>Alunos</TableHead>
          <TableHead>Curso</TableHead>
          <TableHead>Turno</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {classGroups.map((classGroup) => (
          <TableRow key={classGroup.id}>
            <TableCell>
              <Truncated className="max-w-64">{classGroup.name}</Truncated>
            </TableCell>
            <TableCell>{classGroup.semester}</TableCell>
            <TableCell>{classGroup.module}</TableCell>
            <TableCell>{classGroup.student_count}</TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-56">
                {classGroup.course?.name}
              </Truncated>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-40">
                {classGroup.shift?.name}
              </Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <ClassGroupDialog
                  classGroup={classGroup}
                  shiftOptions={shiftOptions}
                  courseOptions={courseOptions}
                  trigger={{
                    icon: "edit",
                    ariaLabel: `Editar ${classGroup.name}`,
                  }}
                />
                <DeleteDialog
                  id={classGroup.id}
                  name={classGroup.name}
                  entityLabel="a turma"
                  action={deleteClassGroupAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${classGroup.name}`,
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
