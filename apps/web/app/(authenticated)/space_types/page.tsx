import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { SpaceTypeDialog } from "@/components/space-types/space-type-dialog"
import { SpaceTypesTable } from "@/components/space-types/space-types-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listSpaceTypes } from "@solara/db/actions/space-types"
import { listSpaceTypesQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Tipos de Espaços" }

const PATHNAME = "/space_types"

export default async function SpaceTypesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")

  const parsed = listSpaceTypesQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
  })
  const query = parsed.success
    ? parsed.data
    : listSpaceTypesQuerySchema.parse({})

  const { content, pagination } = await listSpaceTypes(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Espaços"
        description="Gerenciar tipos de espaços"
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <FilterForm>
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={name ?? ""}
                  placeholder="Filtrar por nome"
                  className="w-full sm:w-64"
                />
              </div>
            </FilterForm>

            {canManage ? (
              <SpaceTypeDialog
                trigger={
                  <Button>
                    <PlusIcon /> Adicionar Tipo de Espaço
                  </Button>
                }
              />
            ) : null}
          </div>

          <SpaceTypesTable spaceTypes={content} canManage={canManage} />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="tipos de espaços"
          />
        </CardContent>
      </Card>
    </div>
  )
}
