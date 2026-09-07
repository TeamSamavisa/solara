import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { ClassGroupDialog } from "@/components/class-groups/class-group-dialog"
import { ClassGroupsTable } from "@/components/class-groups/class-groups-table"
import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listClassGroups } from "@/lib/db/actions/class-groups"
import { listCourses } from "@/lib/db/actions/courses"
import { listShifts } from "@/lib/db/actions/shifts"
import { listClassGroupsQuerySchema } from "@/lib/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Turmas" }

const PATHNAME = "/class_groups"

export default async function ClassGroupsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")
  const classModule = firstParam(params, "module")

  const parsed = listClassGroupsQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
    module: classModule,
  })
  const query = parsed.success
    ? parsed.data
    : listClassGroupsQuerySchema.parse({})

  const [{ content, pagination }, shifts, courses] = await Promise.all([
    listClassGroups(query),
    listShifts({ limit: 100 }),
    listCourses({ limit: 100 }),
  ])

  const shiftOptions = shifts.content.map((shift) => ({
    value: String(shift.id),
    label: shift.name,
  }))
  const courseOptions = courses.content.map((course) => ({
    value: String(course.id),
    label: course.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Turmas" description="Gerenciar turmas" />

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
                <Label htmlFor="module">Módulo</Label>
                <Input
                  id="module"
                  name="module"
                  defaultValue={classModule ?? ""}
                  placeholder="Buscar por módulo"
                  className="w-full sm:w-40"
                />
              </div>
            </FilterForm>

            {canManage ? (
              <ClassGroupDialog
                shiftOptions={shiftOptions}
                courseOptions={courseOptions}
                trigger={
                  <Button>
                    <PlusIcon /> Adicionar Turma
                  </Button>
                }
              />
            ) : null}
          </div>

          <ClassGroupsTable
            classGroups={content}
            shiftOptions={shiftOptions}
            courseOptions={courseOptions}
            canManage={canManage}
          />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="turmas"
          />
        </CardContent>
      </Card>
    </div>
  )
}
