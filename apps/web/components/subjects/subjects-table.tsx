
import { Truncated } from "@/components/shared/truncated"
import { deleteSubjectAction } from "@/app/(authenticated)/subjects/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
import { SubjectDialog } from "@/components/subjects/subject-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SubjectWithRelations } from "@solara/db/actions/subjects"

export function SubjectsTable({
  subjects,
  spaceTypeOptions,
  courseOptions,
  canManage,
}: {
  subjects: SubjectWithRelations[]
  spaceTypeOptions: SelectOption[]
  courseOptions: SelectOption[]
  canManage: boolean
}) {
  if (subjects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma disciplina encontrada.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Curso</TableHead>
          <TableHead>Tipo de Espaço</TableHead>
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {subjects.map((subject) => (
          <TableRow key={subject.id}>
            <TableCell>
              <Truncated className="max-w-72">{subject.name}</Truncated>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-56">{subject.course?.name}</Truncated>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-48">
                {subject.requiredSpaceType?.name}
              </Truncated>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <SubjectDialog
                  subject={subject}
                  spaceTypeOptions={spaceTypeOptions}
                  courseOptions={courseOptions}
                  trigger={{
                    icon: "edit",
                    ariaLabel: `Editar ${subject.name}`,
                  }}
                />
                <DeleteDialog
                  id={subject.id}
                  name={subject.name}
                  entityLabel="a disciplina"
                  action={deleteSubjectAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${subject.name}`,
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
