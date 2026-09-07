import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteSubjectAction } from "@/app/(authenticated)/subjects/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import type { SelectOption } from "@/components/shared/form-fields"
import { SubjectDialog } from "@/components/subjects/subject-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SubjectWithRelations } from "@/lib/db/actions/subjects"

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
      <p className="text-muted-foreground py-8 text-center text-sm">
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
            <TableCell>{subject.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {subject.course?.name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {subject.requiredSpaceType?.name ?? "—"}
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <SubjectDialog
                  subject={subject}
                  spaceTypeOptions={spaceTypeOptions}
                  courseOptions={courseOptions}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${subject.name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={subject.id}
                  name={subject.name}
                  entityLabel="a disciplina"
                  action={deleteSubjectAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${subject.name}`}
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
