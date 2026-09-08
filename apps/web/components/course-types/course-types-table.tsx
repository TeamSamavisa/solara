
import { Truncated } from "@/components/shared/truncated"
import { deleteCourseTypeAction } from "@/app/(authenticated)/course-types/actions"
import { CourseTypeDialog } from "@/components/course-types/course-type-dialog"
import { DeleteDialog } from "@/components/shared/delete-dialog"
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
      <p className="py-8 text-center text-sm text-muted-foreground">
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
            <TableCell>
              <Truncated className="max-w-64">{courseType.name}</Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <CourseTypeDialog
                  courseType={courseType}
                  trigger={{
                    icon: "edit",
                    ariaLabel: `Editar ${courseType.name}`,
                  }}
                />
                <DeleteDialog
                  id={courseType.id}
                  name={courseType.name}
                  entityLabel="o tipo de curso"
                  action={deleteCourseTypeAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${courseType.name}`,
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
