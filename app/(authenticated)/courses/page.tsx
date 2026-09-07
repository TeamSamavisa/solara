import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { CourseDialog } from "@/components/courses/course-dialog"
import { CoursesTable } from "@/components/courses/courses-table"
import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listCourseTypes } from "@/lib/db/actions/course-types"
import { listCourses } from "@/lib/db/actions/courses"
import { listCoursesQuerySchema } from "@/lib/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Cursos" }

const PATHNAME = "/courses"

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const name = firstParam(params, "name")

  const parsed = listCoursesQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    name,
  })
  const query = parsed.success ? parsed.data : listCoursesQuerySchema.parse({})

  const [{ content, pagination }, courseTypes] = await Promise.all([
    listCourses(query),
    listCourseTypes({ limit: 100 }),
  ])

  const courseTypeOptions = courseTypes.content.map((courseType) => ({
    value: String(courseType.id),
    label: courseType.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Cursos" description="Gerenciar cursos" />

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
              <CourseDialog
                courseTypeOptions={courseTypeOptions}
                trigger={
                  <Button>
                    <PlusIcon /> Adicionar Curso
                  </Button>
                }
              />
            ) : null}
          </div>

          <CoursesTable
            courses={content}
            courseTypeOptions={courseTypeOptions}
            canManage={canManage}
          />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="cursos"
          />
        </CardContent>
      </Card>
    </div>
  )
}
