import type { Metadata } from "next"

import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { TeacherDialog } from "@/components/teachers/teacher-dialog"
import { TeachersTable } from "@/components/teachers/teachers-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listAvailabilityByTeacher } from "@solara/db/actions/schedule-teachers"
import { listSchedules } from "@solara/db/actions/schedules"
import { listTeachers } from "@solara/db/actions/users"
import { listUsersQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"

export const metadata: Metadata = { title: "Professores" }

const PATHNAME = "/teachers"

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

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

  const { content, pagination } = await listTeachers(query)

  // Availability is loaded for the whole page in one query instead of one per
  // row, and only when it can actually be edited.
  const [schedules, availability] = await Promise.all([
    canManage ? listSchedules({ limit: 100 }) : null,
    canManage
      ? listAvailabilityByTeacher(content.map((teacher) => teacher.id))
      : null,
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Professores" description="Gerenciar professores" />

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

            {canManage ? (
              <TeacherDialog
                trigger={{ icon: "add", label: "Adicionar Professor" }}
              />
            ) : null}
          </div>

          <TeachersTable
            teachers={content}
            slots={schedules?.content ?? []}
            availabilityByTeacher={Object.fromEntries(availability ?? [])}
            canManage={canManage}
          />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="professores"
          />
        </CardContent>
      </Card>
    </div>
  )
}
