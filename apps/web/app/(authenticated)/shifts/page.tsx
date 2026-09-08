import type { Metadata } from "next"

import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { ShiftDialog } from "@/components/shifts/shift-dialog"
import { ShiftsTable } from "@/components/shifts/shifts-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listShifts } from "@solara/db/actions/shifts"
import { listShiftsQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Turnos" }

const PATHNAME = "/shifts"

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  // Viewing is open to coordinators and above; mutations stay admin-only.
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")

  // Search params come from the user, so a bad value falls back to the
  // defaults instead of crashing the page.
  const parsed = listShiftsQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
  })
  const query = parsed.success ? parsed.data : listShiftsQuerySchema.parse({})

  const { content, pagination } = await listShifts(query)

  return (
    <div className="space-y-6">
      <PageHeader title="Turnos" description="Gerenciar turnos" />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {/* A plain GET form keeps filtering on the server, no JS needed. */}
            <FilterForm>
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={name ?? ""}
                  placeholder="Buscar por nome"
                  className="w-full sm:w-64"
                />
              </div>
            </FilterForm>

            {canManage ? (
              <ShiftDialog
                trigger={{ icon: "add", label: "Adicionar Turno" }}
              />
            ) : null}
          </div>

          <ShiftsTable shifts={content} canManage={canManage} />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="turnos"
          />
        </CardContent>
      </Card>
    </div>
  )
}
