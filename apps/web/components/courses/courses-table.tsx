import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteCourseAction } from "@/app/(authenticated)/courses/actions"
import { CourseDialog } from "@/components/courses/course-dialog"
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
import type { CourseWithType } from "@solara/db/actions/courses"

export function CoursesTable({
  courses,
  courseTypeOptions,
  canManage,
}: {
  courses: CourseWithType[]
  courseTypeOptions: SelectOption[]
  canManage: boolean
}) {
  if (courses.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum curso encontrado.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo de Curso</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell>{course.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {course.courseType?.name ?? "—"}
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <CourseDialog
                  course={course}
                  courseTypeOptions={courseTypeOptions}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${course.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={course.id}
                  name={course.name}
                  entityLabel="o curso"
                  action={deleteCourseAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${course.name}`}
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
