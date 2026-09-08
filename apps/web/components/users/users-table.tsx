
import { Truncated } from "@/components/shared/truncated"
import { deleteUserAction } from "@/app/(authenticated)/users/actions"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { UserDialog } from "@/components/users/user-dialog"
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

export function UsersTable({
  users,
  canManage,
}: {
  users: PublicUser[]
  canManage: boolean
}) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
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
            <TableCell>
              <Truncated className="max-w-56">{user.full_name}</Truncated>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-56">{user.email}</Truncated>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <Truncated className="max-w-32">{user.registration}</Truncated>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{roleLabel(user.role)}</Badge>
            </TableCell>
            {canManage ? (
              <TableCell className="flex justify-end gap-2">
                <UserDialog
                  user={user}
                  trigger={{
                    icon: "edit",
                    ariaLabel: `Editar ${user.full_name}`,
                  }}
                />
                <DeleteDialog
                  id={user.id}
                  name={user.full_name}
                  entityLabel="o usuário"
                  action={deleteUserAction}
                  trigger={{
                    icon: "delete",
                    ariaLabel: `Excluir ${user.full_name}`,
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
