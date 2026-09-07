import { PencilIcon, Trash2Icon } from "lucide-react"

import { deleteUserAction } from "@/app/(authenticated)/users/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { UserDialog } from "@/components/users/user-dialog"
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

export function UsersTable({
  users,
  canManage,
}: {
  users: PublicUser[]
  canManage: boolean
}) {
  if (users.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum usuário encontrado.
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
          {canManage ? (
            <TableHead className="text-right">Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.full_name}</TableCell>
            <TableCell className="text-muted-foreground">
              {user.email}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {user.registration ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{roleLabel(user.role)}</Badge>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <UserDialog
                  user={user}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${user.full_name}`}
                    >
                      <PencilIcon />
                    </Button>
                  }
                />
                <DeleteDialog
                  id={user.id}
                  name={user.full_name}
                  entityLabel="o usuário"
                  action={deleteUserAction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${user.full_name}`}
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
