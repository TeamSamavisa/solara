import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteClassGroupAction } from "@/app/(authenticated)/class_groups/actions"
import { ClassGroupDialog } from "@/components/class-groups/class-group-dialog"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ClassGroupWithRelations } from "@/lib/db/actions/class-groups"

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
      <p className="text-muted-foreground py-8 text-center text-sm">
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
            <TableCell>{classGroup.name}</TableCell>
            <TableCell>{classGroup.semester}</TableCell>
            <TableCell>{classGroup.module}</TableCell>
            <TableCell>{classGroup.student_count}</TableCell>
            <TableCell className="text-muted-foreground">
              {classGroup.course?.name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {classGroup.shift?.name ?? "—"}
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <ClassGroupDialog
                  classGroup={classGroup}
                  shiftOptions={shiftOptions}
                  courseOptions={courseOptions}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${classGroup.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={classGroup.id}
                  name={classGroup.name}
                  entityLabel="a turma"
                  action={deleteClassGroupAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${classGroup.name}`}
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
