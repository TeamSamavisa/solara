import { PlusIcon, TriangleAlertIcon } from "lucide-react"
import type { Metadata } from "next"

import { AssignmentDialog } from "@/components/assignments/assignment-dialog"
import { AssignmentsTable } from "@/components/assignments/assignments-table"
import { AssignmentsTabs } from "@/components/assignments/assignments-tabs"
import { PrintButton } from "@/components/assignments/print-button"
import { TimetableGrid } from "@/components/assignments/timetable-grid"
import { FilterForm, PageHeader } from "@/components/shared/list-chrome"
import { ListPagination } from "@/components/shared/list-pagination"
import { SelectFilter } from "@/components/shared/select-filter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/dal"
import { hasRole } from "@/lib/auth/roles"
import { listAssignments } from "@/lib/db/actions/assignments"
import { listClassGroups } from "@/lib/db/actions/class-groups"
import { listCourses } from "@/lib/db/actions/courses"
import { listSchedules } from "@/lib/db/actions/schedules"
import { listShifts } from "@/lib/db/actions/shifts"
import { listSpaces } from "@/lib/db/actions/spaces"
import { listSubjects } from "@/lib/db/actions/subjects"
import { listTeachers } from "@/lib/db/actions/users"
import { listAssignmentsQuerySchema } from "@/lib/db/schemas"
import { firstParam, type SearchParamsRecord } from "@/lib/search-params"
import { buildTimetable } from "@/lib/timetable"
import { weekdayLabel } from "@/lib/weekdays"

export const metadata: Metadata = { title: "Alocações" }

const PATHNAME = "/assignments"
const OPTIONS_LIMIT = 100

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const session = await requireRole("coordinator")
  const canManage = hasRole(session.role, "admin")

  const params = await searchParams
  const tab = firstParam(params, "tab") ?? "list"

  const parsed = listAssignmentsQuerySchema.safeParse({
    page: firstParam(params, "page"),
    limit: firstParam(params, "limit"),
    teacher_id: firstParam(params, "teacher_id"),
    subject_id: firstParam(params, "subject_id"),
    space_id: firstParam(params, "space_id"),
    schedule_id: firstParam(params, "schedule_id"),
    class_group_id: firstParam(params, "class_group_id"),
  })
  const query = parsed.success
    ? parsed.data
    : listAssignmentsQuerySchema.parse({})

  const [
    listed,
    teachers,
    subjects,
    classGroups,
    spaces,
    schedules,
    courses,
    shifts,
  ] = await Promise.all([
    listAssignments(query),
    listTeachers({ limit: OPTIONS_LIMIT }),
    listSubjects({ limit: OPTIONS_LIMIT }),
    listClassGroups({ limit: OPTIONS_LIMIT }),
    listSpaces({ limit: OPTIONS_LIMIT }),
    listSchedules({ limit: OPTIONS_LIMIT }),
    listCourses({ limit: OPTIONS_LIMIT }),
    listShifts({ limit: OPTIONS_LIMIT }),
  ])

  const options = {
    teacherOptions: teachers.content.map((teacher) => ({
      value: String(teacher.id),
      label: teacher.full_name,
    })),
    subjectOptions: subjects.content.map((subject) => ({
      value: String(subject.id),
      label: subject.name,
    })),
    classGroupOptions: classGroups.content.map((classGroup) => ({
      value: String(classGroup.id),
      label: classGroup.name,
    })),
    spaceOptions: spaces.content.map((space) => ({
      value: String(space.id),
      label: space.name,
    })),
    slots: schedules.content,
  }

  const scheduleOptions = schedules.content.map((schedule) => ({
    value: String(schedule.id),
    label: `${weekdayLabel(schedule.weekday)} ${schedule.start_time}–${schedule.end_time}`,
  }))

  // --- Print tab -----------------------------------------------------------
  const printCourseId = firstParam(params, "print_course_id")
  const printClassGroupId = firstParam(params, "print_class_group_id")
  const printShiftId = firstParam(params, "print_shift_id")

  // The class group list narrows to the chosen course, as in the legacy tab.
  const printClassGroups = printCourseId
    ? classGroups.content.filter(
        (classGroup) => String(classGroup.course_id) === printCourseId,
      )
    : []

  const printClassGroup = printClassGroups.find(
    (classGroup) => String(classGroup.id) === printClassGroupId,
  )

  // The optional shift filter matches the shift of the class group itself.
  const shiftMatches =
    !printShiftId ||
    (printClassGroup !== undefined &&
      String(printClassGroup.shift_id) === printShiftId)

  const printable =
    printClassGroup && shiftMatches
      ? await listAssignments({
          class_group_id: printClassGroup.id,
          limit: OPTIONS_LIMIT,
        })
      : null

  const printCourse = courses.content.find(
    (course) => String(course.id) === printCourseId,
  )
  const printShift = shifts.content.find(
    (shift) => String(shift.id) === printShiftId,
  )

  const listPanel = (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <FilterForm>
            <input type="hidden" name="tab" value="list" />
            <div className="grid gap-1.5">
              <Label htmlFor="class_group_id">Turma</Label>
              <SelectFilter
                id="class_group_id"
                name="class_group_id"
                options={options.classGroupOptions}
                defaultValue={firstParam(params, "class_group_id") ?? ""}
                className="w-full sm:w-44"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="teacher_id">Professor</Label>
              <SelectFilter
                id="teacher_id"
                name="teacher_id"
                options={options.teacherOptions}
                defaultValue={firstParam(params, "teacher_id") ?? ""}
                className="w-full sm:w-44"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="subject_id">Disciplina</Label>
              <SelectFilter
                id="subject_id"
                name="subject_id"
                options={options.subjectOptions}
                defaultValue={firstParam(params, "subject_id") ?? ""}
                className="w-full sm:w-44"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="space_id">Espaço</Label>
              <SelectFilter
                id="space_id"
                name="space_id"
                options={options.spaceOptions}
                defaultValue={firstParam(params, "space_id") ?? ""}
                className="w-full sm:w-40"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="schedule_id">Horário</Label>
              <SelectFilter
                id="schedule_id"
                name="schedule_id"
                options={scheduleOptions}
                defaultValue={firstParam(params, "schedule_id") ?? ""}
                className="w-full sm:w-48"
              />
            </div>
          </FilterForm>

          {canManage ? (
            <AssignmentDialog
              {...options}
              trigger={
                <Button>
                  <PlusIcon /> Adicionar Alocação
                </Button>
              }
            />
          ) : null}
        </div>

        <AssignmentsTable
          assignments={listed.content}
          options={options}
          canManage={canManage}
        />

        <ListPagination
          pathname={PATHNAME}
          searchParams={params}
          pagination={listed.pagination}
          label="alocações"
        />
      </CardContent>
    </Card>
  )

  const optimizePanel = (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>Otimização indisponível</AlertTitle>
      <AlertDescription>
        A geração automática da grade depende do serviço externo de
        timetabling, que ainda não foi migrado. Enquanto isso, as alocações
        podem ser criadas e ajustadas manualmente na aba Listagem.
      </AlertDescription>
    </Alert>
  )

  const printPanel = (
    <Card>
      <CardContent className="space-y-4">
        <div
          data-print-hide
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <FilterForm>
            <input type="hidden" name="tab" value="print" />
            <div className="grid gap-1.5">
              <Label htmlFor="print_course_id">Curso</Label>
              <SelectFilter
                id="print_course_id"
                name="print_course_id"
                options={courses.content.map((course) => ({
                  value: String(course.id),
                  label: course.name,
                }))}
                defaultValue={printCourseId ?? ""}
                allLabel="Selecione um curso"
                className="w-full sm:w-52"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="print_class_group_id">Turma</Label>
              <SelectFilter
                id="print_class_group_id"
                name="print_class_group_id"
                options={printClassGroups.map((classGroup) => ({
                  value: String(classGroup.id),
                  label: classGroup.name,
                }))}
                defaultValue={printClassGroupId ?? ""}
                allLabel={
                  printCourseId
                    ? "Selecione uma turma"
                    : "Escolha um curso primeiro"
                }
                className="w-full sm:w-52"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="print_shift_id">Turno</Label>
              <SelectFilter
                id="print_shift_id"
                name="print_shift_id"
                options={shifts.content.map((shift) => ({
                  value: String(shift.id),
                  label: shift.name,
                }))}
                defaultValue={printShiftId ?? ""}
                allLabel="Todos os turnos"
                className="w-full sm:w-44"
              />
            </div>
          </FilterForm>

          {printable ? <PrintButton /> : null}
        </div>

        {!printClassGroup ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            {printCourseId
              ? "Selecione uma turma para visualizar a grade horária."
              : "Selecione um curso e uma turma para visualizar a grade horária."}
          </p>
        ) : !shiftMatches ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Esta turma não pertence ao turno selecionado.
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">
                {printCourse?.name} — {printClassGroup.name}
                {printShift ? ` — ${printShift.name}` : ""}
              </h2>
              <p className="text-muted-foreground">
                Grade Horária · {new Date().getFullYear()}
              </p>
            </div>

            <TimetableGrid
              timetable={buildTimetable(printable?.content ?? [])}
            />
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alocações"
        description="Gerenciar alocações de aulas"
      />

      <AssignmentsTabs
        defaultTab={tab}
        list={listPanel}
        optimize={optimizePanel}
        print={printPanel}
      />
    </div>
  )
}
