import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { SubjectDialog } from "@/components/subjects/subject-dialog"
import { SubjectsTable } from "@/components/subjects/subjects-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listCourses } from "@solara/db/actions/courses"
import { listSpaceTypes } from "@solara/db/actions/space-types"
import { listSubjects } from "@solara/db/actions/subjects"
import { listSubjectsQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Disciplinas" }

const PATHNAME = "/subjects"

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")

  const parsed = listSubjectsQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
  })
  const query = parsed.success ? parsed.data : listSubjectsQuerySchema.parse({})

  const [{ content, pagination }, spaceTypes, courses] = await Promise.all([
    listSubjects(query),
    listSpaceTypes({ limit: 100 }),
    listCourses({ limit: 100 }),
  ])

  const spaceTypeOptions = spaceTypes.content.map((spaceType) => ({
    value: String(spaceType.id),
    label: spaceType.name,
  }))
  const courseOptions = courses.content.map((course) => ({
    value: String(course.id),
    label: course.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Disciplinas" description="Gerenciar disciplinas" />

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
                  className="w-full sm:w-64"
                />
              </div>
            </FilterForm>

            {canManage ? (
              <SubjectDialog
                spaceTypeOptions={spaceTypeOptions}
                courseOptions={courseOptions}
                trigger={
                  <Button>
                    <PlusIcon /> Adicionar Disciplina
                  </Button>
                }
              />
            ) : null}
          </div>

          <SubjectsTable
            subjects={content}
            spaceTypeOptions={spaceTypeOptions}
            courseOptions={courseOptions}
            canManage={canManage}
          />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="disciplinas"
          />
        </CardContent>
      </Card>
    </div>
  )
}
