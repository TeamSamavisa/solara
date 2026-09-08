
import { Truncated } from "@/components/shared/truncated"
import { deleteCourseAction } from "@/app/(authenticated)/courses/actions"
import { CourseDialog } from "@/components/courses/course-dialog"
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
      <p className="py-8 text-center text-sm text-muted-foreground">
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
            <TableCell>
              <Truncated className="max-w-72">{course.name}</Truncated>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-48">
                {course.courseType?.name}
              </Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <CourseDialog
                  course={course}
                  courseTypeOptions={courseTypeOptions}
                  trigger={{ icon: "edit", ariaLabel: `Editar ${course.name}` }}
                />
                <DeleteDialog
                  id={course.id}
                  name={course.name}
                  entityLabel="o curso"
                  action={deleteCourseAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${course.name}`,
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
