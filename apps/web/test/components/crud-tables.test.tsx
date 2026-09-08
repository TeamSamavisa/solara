/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"

import { ClassGroupsTable } from "@/components/class-groups/class-groups-table"
import { CourseTypesTable } from "@/components/course-types/course-types-table"
import { CoursesTable } from "@/components/courses/courses-table"
import { SchedulesTable } from "@/components/schedules/schedules-table"
import { SpaceTypesTable } from "@/components/space-types/space-types-table"
import { SpacesTable } from "@/components/spaces/spaces-table"
import { SubjectsTable } from "@/components/subjects/subjects-table"

jest.mock("@/app/(authenticated)/course-types/actions", () => ({
  createCourseTypeAction: jest.fn(),
  updateCourseTypeAction: jest.fn(),
  deleteCourseTypeAction: jest.fn(),
}))
jest.mock("@/app/(authenticated)/space_types/actions", () => ({
  createSpaceTypeAction: jest.fn(),
  updateSpaceTypeAction: jest.fn(),
  deleteSpaceTypeAction: jest.fn(),
}))
jest.mock("@/app/(authenticated)/courses/actions", () => ({
  createCourseAction: jest.fn(),
  updateCourseAction: jest.fn(),
  deleteCourseAction: jest.fn(),
}))
jest.mock("@/app/(authenticated)/spaces/actions", () => ({
  createSpaceAction: jest.fn(),
  updateSpaceAction: jest.fn(),
  deleteSpaceAction: jest.fn(),
}))
jest.mock("@/app/(authenticated)/subjects/actions", () => ({
  createSubjectAction: jest.fn(),
  updateSubjectAction: jest.fn(),
  deleteSubjectAction: jest.fn(),
}))
jest.mock("@/app/(authenticated)/class_groups/actions", () => ({
  createClassGroupAction: jest.fn(),
  updateClassGroupAction: jest.fn(),
  deleteClassGroupAction: jest.fn(),
}))
jest.mock("@/app/(authenticated)/schedules/actions", () => ({
  createScheduleAction: jest.fn(),
  updateScheduleAction: jest.fn(),
  deleteScheduleAction: jest.fn(),
}))

const options = [{ value: "1", label: "Opção" }]

interface TableCase {
  label: string
  /** Text expected in the row when data is present. */
  expected: string[]
  /** Free-text value expected to be clipped; defaults to the first one. */
  truncated?: string
  /** Accessible name of the edit control for the first row. */
  editLabel: string
  emptyText: string
  renderWith: (canManage: boolean) => React.ReactElement
  renderEmpty: () => React.ReactElement
}

const cases: TableCase[] = [
  {
    label: "course types",
    expected: ["Tecnólogo"],
    editLabel: "Editar Tecnólogo",
    emptyText: "Nenhum tipo de curso encontrado.",
    renderWith: (canManage) => (
      <CourseTypesTable
        canManage={canManage}
        courseTypes={[{ id: 1, name: "Tecnólogo" }] as never}
      />
    ),
    renderEmpty: () => <CourseTypesTable canManage courseTypes={[]} />,
  },
  {
    label: "space types",
    expected: ["Laboratório"],
    editLabel: "Editar Laboratório",
    emptyText: "Nenhum tipo de espaço encontrado.",
    renderWith: (canManage) => (
      <SpaceTypesTable
        canManage={canManage}
        spaceTypes={[{ id: 1, name: "Laboratório" }] as never}
      />
    ),
    renderEmpty: () => <SpaceTypesTable canManage spaceTypes={[]} />,
  },
  {
    label: "courses",
    expected: ["ADS", "Tecnólogo"],
    editLabel: "Editar ADS",
    emptyText: "Nenhum curso encontrado.",
    renderWith: (canManage) => (
      <CoursesTable
        canManage={canManage}
        courseTypeOptions={options}
        courses={
          [
            {
              id: 1,
              name: "ADS",
              course_type_id: 2,
              courseType: { id: 2, name: "Tecnólogo" },
            },
          ] as never
        }
      />
    ),
    renderEmpty: () => (
      <CoursesTable canManage courseTypeOptions={options} courses={[]} />
    ),
  },
  {
    label: "spaces",
    expected: ["Lab 1", "40", "Disponível"],
    editLabel: "Editar Lab 1",
    emptyText: "Nenhum espaço encontrado.",
    renderWith: (canManage) => (
      <SpacesTable
        canManage={canManage}
        spaceTypeOptions={options}
        spaces={
          [
            {
              id: 1,
              name: "Lab 1",
              floor: 2,
              capacity: 40,
              blocked: false,
              space_type_id: 3,
              spaceType: { id: 3, name: "Laboratório" },
            },
          ] as never
        }
      />
    ),
    renderEmpty: () => (
      <SpacesTable canManage spaceTypeOptions={options} spaces={[]} />
    ),
  },
  {
    label: "subjects",
    expected: ["Banco de Dados", "ADS"],
    editLabel: "Editar Banco de Dados",
    emptyText: "Nenhuma disciplina encontrada.",
    renderWith: (canManage) => (
      <SubjectsTable
        canManage={canManage}
        spaceTypeOptions={options}
        courseOptions={options}
        subjects={
          [
            {
              id: 1,
              name: "Banco de Dados",
              required_space_type_id: 3,
              course_id: 2,
              course: { id: 2, name: "ADS" },
              requiredSpaceType: { id: 3, name: "Laboratório" },
            },
          ] as never
        }
      />
    ),
    renderEmpty: () => (
      <SubjectsTable
        canManage
        spaceTypeOptions={options}
        courseOptions={options}
        subjects={[]}
      />
    ),
  },
  {
    label: "class groups",
    expected: ["ADS 2024/1", "2024.1", "30"],
    editLabel: "Editar ADS 2024/1",
    emptyText: "Nenhuma turma encontrada.",
    renderWith: (canManage) => (
      <ClassGroupsTable
        canManage={canManage}
        shiftOptions={options}
        courseOptions={options}
        classGroups={
          [
            {
              id: 1,
              name: "ADS 2024/1",
              semester: "2024.1",
              module: "1",
              student_count: 30,
              shift_id: 1,
              course_id: 2,
              shift: { id: 1, name: "Matutino" },
              course: { id: 2, name: "ADS" },
            },
          ] as never
        }
      />
    ),
    renderEmpty: () => (
      <ClassGroupsTable
        canManage
        shiftOptions={options}
        courseOptions={options}
        classGroups={[]}
      />
    ),
  },
  {
    label: "schedules",
    expected: ["Segunda", "07:30", "09:10", "Matutino"],
    truncated: "Matutino",
    editLabel: "Editar Segunda 07:30-09:10",
    emptyText: "Nenhum horário encontrado.",
    renderWith: (canManage) => (
      <SchedulesTable
        canManage={canManage}
        shiftOptions={options}
        schedules={
          [
            {
              id: 1,
              weekday: "Monday",
              start_time: "07:30",
              end_time: "09:10",
              shift_id: 1,
              shift: { id: 1, name: "Matutino" },
            },
          ] as never
        }
      />
    ),
    renderEmpty: () => (
      <SchedulesTable canManage shiftOptions={options} schedules={[]} />
    ),
  },
]

describe.each(cases)("$label table", (testCase) => {
  it("renders the row data", () => {
    render(testCase.renderWith(false))

    for (const text of testCase.expected) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
  })

  // Free-text columns hold names long enough to push the table out of the
  // viewport, so they are clipped and the full value moves to the title.
  it("clips the free-text column and keeps the full value in the title", () => {
    render(testCase.renderWith(false))

    const value = testCase.truncated ?? testCase.expected[0]
    const element = screen.getByText(value)

    expect(element).toHaveClass("truncate")
    expect(element).toHaveAttribute("title", value)
  })

  it("hides the actions column from users who cannot manage", () => {
    render(testCase.renderWith(false))

    expect(screen.queryByText("Ações")).toBeNull()
    expect(screen.queryByLabelText(testCase.editLabel)).toBeNull()
  })

  it("shows the actions to managers", () => {
    render(testCase.renderWith(true))

    expect(screen.getByText("Ações")).toBeInTheDocument()
    expect(screen.getByLabelText(testCase.editLabel)).toBeInTheDocument()
  })

  it("shows an empty state instead of a bare table", () => {
    render(testCase.renderEmpty())

    expect(screen.getByText(testCase.emptyText)).toBeInTheDocument()
    expect(screen.queryByRole("table")).toBeNull()
  })
})

describe("schedules table", () => {
  it("translates the stored weekday into Portuguese", () => {
    render(
      <SchedulesTable
        canManage={false}
        shiftOptions={options}
        schedules={
          [
            {
              id: 1,
              weekday: "Wednesday",
              start_time: "10:00",
              end_time: "11:40",
              shift_id: 1,
              shift: { id: 1, name: "Matutino" },
            },
          ] as never
        }
      />
    )

    expect(screen.getByText("Quarta")).toBeInTheDocument()
    expect(screen.queryByText("Wednesday")).toBeNull()
  })
})

describe("spaces table", () => {
  it("flags a blocked space", () => {
    render(
      <SpacesTable
        canManage={false}
        spaceTypeOptions={options}
        spaces={
          [
            {
              id: 1,
              name: "Lab 9",
              floor: 1,
              capacity: 10,
              blocked: true,
              space_type_id: 3,
              spaceType: { id: 3, name: "Laboratório" },
            },
          ] as never
        }
      />
    )

    expect(screen.getByText("Bloqueado")).toBeInTheDocument()
  })
})
