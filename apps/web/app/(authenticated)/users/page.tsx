import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { UserDialog } from "@/components/users/user-dialog"
import { UsersTable } from "@/components/users/users-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { listUsers } from "@solara/db/actions/users"
import { listUsersQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Usuários" }

const PATHNAME = "/users"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  // Admin-only area, as in the legacy router.
  await requireRole("admin")

  const params = await searchParams
  const fullName = firstParam(params, "full_name")
  const email = firstParam(params, "email")

  const parsed = listUsersQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    full_name: fullName,
    email,
  })
  const query = parsed.success ? parsed.data : listUsersQuerySchema.parse({})

  const { content, pagination } = await listUsers(query)

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" description="Gerenciar usuários" />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <FilterForm>
              <div className="grid gap-1.5">
                <Label htmlFor="full_name">Nome</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={fullName ?? ""}
                  placeholder="Buscar por nome"
                  className="w-full sm:w-56"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  defaultValue={email ?? ""}
                  placeholder="Buscar por e-mail"
                  className="w-full sm:w-56"
                />
              </div>
            </FilterForm>

            <UserDialog
              trigger={
                <Button>
                  <PlusIcon /> Adicionar Usuário
                </Button>
              }
            />
          </div>

          <UsersTable users={content} canManage />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="usuários"
          />
        </CardContent>
      </Card>
    </div>
  )
}
