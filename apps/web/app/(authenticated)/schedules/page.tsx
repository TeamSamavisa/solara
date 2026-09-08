import type { Metadata } from "next"

import { ScheduleDialog } from "@/components/schedules/schedule-dialog"
import { SchedulesTable } from "@/components/schedules/schedules-table"
import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { SelectFilter } from "@/components/shared/select-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listSchedules } from "@solara/db/actions/schedules"
import { listShifts } from "@solara/db/actions/shifts"
import { listSchedulesQuerySchema } from "@solara/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"
import { WEEKDAYS } from "@/lib/weekdays"

export const metadata: Metadata = { title: "Horários" }

const PATHNAME = "/schedules"

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const weekday = firstParam(params, "weekday")

  const parsed = listSchedulesQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    weekday,
  })
  const query = parsed.success
    ? parsed.data
    : listSchedulesQuerySchema.parse({})

  const [{ content, pagination }, shifts] = await Promise.all([
    listSchedules(query),
    listShifts({ limit: 100 }),
  ])

  const shiftOptions = shifts.content.map((shift) => ({
    value: String(shift.id),
    label: shift.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Horários" description="Gerenciar horários" />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <FilterForm>
              <div className="grid gap-1.5">
                <Label htmlFor="weekday">Dia da semana</Label>
                <SelectFilter
                  id="weekday"
                  name="weekday"
                  defaultValue={weekday ?? ""}
                  options={WEEKDAYS}
                  className="w-full sm:w-56"
                />
              </div>
            </FilterForm>

            {canManage ? (
              <ScheduleDialog
                shiftOptions={shiftOptions}
                trigger={{ icon: "add", label: "Adicionar Horário" }}
              />
            ) : null}
          </div>

          <SchedulesTable
            schedules={content}
            shiftOptions={shiftOptions}
            canManage={canManage}
          />

          <ListPagination
            pathname={PATHNAME}
            searchParams={params}
            pagination={pagination}
            label="horários"
          />
        </CardContent>
      </Card>
    </div>
  )
}
