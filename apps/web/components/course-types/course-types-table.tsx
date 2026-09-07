import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteCourseTypeAction } from "@/app/(authenticated)/course-types/actions"
import { CourseTypeDialog } from "@/components/course-types/course-type-dialog"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CourseType } from "@solara/db/schemas"

export function CourseTypesTable({
  courseTypes,
  canManage,
}: {
  courseTypes: CourseType[]
  canManage: boolean
}) {
  if (courseTypes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum tipo de curso encontrado.
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
        {courseTypes.map((courseType) => (
          <TableRow key={courseType.id}>
            <TableCell>{courseType.name}</TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <CourseTypeDialog
                  courseType={courseType}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${courseType.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={courseType.id}
                  name={courseType.name}
                  entityLabel="o tipo de curso"
                  action={deleteCourseTypeAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${courseType.name}`}
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
