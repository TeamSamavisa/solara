import type { Metadata } from "next"

import { CourseTypesTable } from "@/components/course-types/course-types-table"
import { CourseTypeDialog } from "@/components/course-types/course-type-dialog"
import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listCourseTypes } from "@solara/db/actions/course-types"
import { listCourseTypesQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Tipos de Cursos" }

const PATHNAME = "/course-types"

export default async function CourseTypesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")

  const parsed = listCourseTypesQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
  })
  const query = parsed.success
    ? parsed.data
    : listCourseTypesQuerySchema.parse({})

  const { content, pagination } = await listCourseTypes(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Cursos"
        description="Gerenciar tipos de cursos"
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
              <CourseTypeDialog
                trigger={{ icon: "add", label: "Adicionar Tipo de Curso" }}
              />
            ) : null}
          </div>

          <CourseTypesTable courseTypes={content} canManage={canManage} />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="tipos de cursos"
          />
        </CardContent>
      </Card>
    </div>
  )
}
