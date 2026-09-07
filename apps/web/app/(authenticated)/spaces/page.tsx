import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { SpaceDialog } from "@/components/spaces/space-dialog"
import { SpacesTable } from "@/components/spaces/spaces-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listSpaceTypes } from "@solara/db/actions/space-types"
import { listSpaces } from "@solara/db/actions/spaces"
import { listSpacesQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Espaços" }

const PATHNAME = "/spaces"

export default async function SpacesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")
  const floor = firstParam(params, "floor")

  const parsed = listSpacesQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
    floor,
  })
  const query = parsed.success ? parsed.data : listSpacesQuerySchema.parse({})

  const [{ content, pagination }, spaceTypes] = await Promise.all([
    listSpaces(query),
    listSpaceTypes({ limit: 100 }),
  ])

  const spaceTypeOptions = spaceTypes.content.map((spaceType) => ({
    value: String(spaceType.id),
    label: spaceType.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Espaços" description="Gerenciar espaços" />

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
                  placeholder="Buscar por nome"
                  className="w-full sm:w-56"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="floor">Andar</Label>
                <Input
                  id="floor"
                  name="floor"
                  type="number"
                  defaultValue={floor ?? ""}
                  placeholder="Ex.: 1"
                  className="w-full sm:w-28"
                />
              </div>
            </FilterForm>

            {canManage ? (
              <SpaceDialog
                spaceTypeOptions={spaceTypeOptions}
                trigger={
                  <Button>
                    <PlusIcon /> Adicionar Espaço
                  </Button>
                }
              />
            ) : null}
          </div>

          <SpacesTable
            spaces={content}
            spaceTypeOptions={spaceTypeOptions}
            canManage={canManage}
          />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="espaços"
          />
        </CardContent>
      </Card>
    </div>
  )
}
