import { revalidatePath } from "next/cache"

import * as assignmentActions from "@/app/(authenticated)/assignments/actions"
import * as classGroupActions from "@/app/(authenticated)/class_groups/actions"
import * as courseTypeActions from "@/app/(authenticated)/course-types/actions"
import * as courseActions from "@/app/(authenticated)/courses/actions"
import * as scheduleActions from "@/app/(authenticated)/schedules/actions"
import * as shiftActions from "@/app/(authenticated)/shifts/actions"
import * as spaceTypeActions from "@/app/(authenticated)/space_types/actions"
import * as spaceActions from "@/app/(authenticated)/spaces/actions"
import * as subjectActions from "@/app/(authenticated)/subjects/actions"
import * as teacherActions from "@/app/(authenticated)/teachers/actions"
import * as userActions from "@/app/(authenticated)/users/actions"
import { requireRole } from "@/lib/auth/dal"
import * as assignmentDb from "@solara/db/actions/assignments"
import * as classGroupDb from "@solara/db/actions/class-groups"
import * as courseTypeDb from "@solara/db/actions/course-types"
import * as courseDb from "@solara/db/actions/courses"
import * as scheduleDb from "@solara/db/actions/schedules"
import * as shiftDb from "@solara/db/actions/shifts"
import * as spaceTypeDb from "@solara/db/actions/space-types"
import * as spaceDb from "@solara/db/actions/spaces"
import * as subjectDb from "@solara/db/actions/subjects"
import * as userDb from "@solara/db/actions/users"
import { ConflictError, NotFoundError } from "@solara/db/errors"
import { runOnce } from "@solara/db/idempotency"
import type { FormState } from "@/lib/forms"

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }))
jest.mock("@/lib/auth/dal", () => ({ requireRole: jest.fn() }))
jest.mock("@solara/db/idempotency", () => ({ runOnce: jest.fn() }))
jest.mock("@solara/db/actions/shifts", () => ({
  createShift: jest.fn(),
  updateShift: jest.fn(),
  removeShift: jest.fn(),
}))
jest.mock("@solara/db/actions/course-types", () => ({
  createCourseType: jest.fn(),
  updateCourseType: jest.fn(),
  removeCourseType: jest.fn(),
}))
jest.mock("@solara/db/actions/space-types", () => ({
  createSpaceType: jest.fn(),
  updateSpaceType: jest.fn(),
  removeSpaceType: jest.fn(),
}))
jest.mock("@solara/db/actions/courses", () => ({
  createCourse: jest.fn(),
  updateCourse: jest.fn(),
  removeCourse: jest.fn(),
}))
jest.mock("@solara/db/actions/spaces", () => ({
  createSpace: jest.fn(),
  updateSpace: jest.fn(),
  removeSpace: jest.fn(),
}))
jest.mock("@solara/db/actions/subjects", () => ({
  createSubject: jest.fn(),
  updateSubject: jest.fn(),
  removeSubject: jest.fn(),
}))
jest.mock("@solara/db/actions/class-groups", () => ({
  createClassGroup: jest.fn(),
  updateClassGroup: jest.fn(),
  removeClassGroup: jest.fn(),
}))
jest.mock("@solara/db/actions/schedules", () => ({
  createSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  removeSchedule: jest.fn(),
}))
jest.mock("@solara/db/actions/users", () => ({
  createUser: jest.fn(),
  updateUser: jest.fn(),
  removeUser: jest.fn(),
}))
jest.mock("@solara/db/actions/assignments", () => ({
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  removeAssignment: jest.fn(),
}))

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>
const mockRunOnce = runOnce as jest.MockedFunction<typeof runOnce>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>

type Action = (
  state: FormState | undefined,
  formData: FormData,
) => Promise<FormState>

interface EntityCase {
  label: string
  path: string
  scope: string
  valid: Record<string, string>
  /** A payload the schema must reject. */
  invalid: Record<string, string>
  invalidField: string
  create: Action
  update: Action
  remove: Action
  db: {
    create: jest.Mock
    update: jest.Mock
    remove: jest.Mock
  }
  createdMessage: string
  replayedMessage: string
  invalidIdMessage: string
  createFailedMessage: string
}

const entities: EntityCase[] = [
  {
    label: "shift",
    path: "/shifts",
    scope: "shift.create",
    valid: { name: "Matutino" },
    invalid: { name: "   " },
    invalidField: "name",
    create: shiftActions.createShiftAction,
    update: shiftActions.updateShiftAction,
    remove: shiftActions.deleteShiftAction,
    db: {
      create: shiftDb.createShift as jest.Mock,
      update: shiftDb.updateShift as jest.Mock,
      remove: shiftDb.removeShift as jest.Mock,
    },
    createdMessage: "Turno criado.",
    replayedMessage: "Este turno já havia sido criado.",
    invalidIdMessage: "Turno inválido.",
    createFailedMessage: "Não foi possível criar o turno.",
  },
  {
    label: "course type",
    path: "/course-types",
    scope: "course-type.create",
    valid: { name: "Tecnólogo" },
    invalid: { name: "" },
    invalidField: "name",
    create: courseTypeActions.createCourseTypeAction,
    update: courseTypeActions.updateCourseTypeAction,
    remove: courseTypeActions.deleteCourseTypeAction,
    db: {
      create: courseTypeDb.createCourseType as jest.Mock,
      update: courseTypeDb.updateCourseType as jest.Mock,
      remove: courseTypeDb.removeCourseType as jest.Mock,
    },
    createdMessage: "Tipo de curso criado.",
    replayedMessage: "Este tipo de curso já havia sido criado.",
    invalidIdMessage: "Tipo de curso inválido.",
    createFailedMessage: "Não foi possível criar o tipo de curso.",
  },
  {
    label: "space type",
    path: "/space_types",
    scope: "space-type.create",
    valid: { name: "Laboratório" },
    invalid: { name: "" },
    invalidField: "name",
    create: spaceTypeActions.createSpaceTypeAction,
    update: spaceTypeActions.updateSpaceTypeAction,
    remove: spaceTypeActions.deleteSpaceTypeAction,
    db: {
      create: spaceTypeDb.createSpaceType as jest.Mock,
      update: spaceTypeDb.updateSpaceType as jest.Mock,
      remove: spaceTypeDb.removeSpaceType as jest.Mock,
    },
    createdMessage: "Tipo de espaço criado.",
    replayedMessage: "Este tipo de espaço já havia sido criado.",
    invalidIdMessage: "Tipo de espaço inválido.",
    createFailedMessage: "Não foi possível criar o tipo de espaço.",
  },
  {
    label: "course",
    path: "/courses",
    scope: "course.create",
    valid: { name: "ADS", course_type_id: "2" },
    invalid: { name: "ADS", course_type_id: "" },
    invalidField: "course_type_id",
    create: courseActions.createCourseAction,
    update: courseActions.updateCourseAction,
    remove: courseActions.deleteCourseAction,
    db: {
      create: courseDb.createCourse as jest.Mock,
      update: courseDb.updateCourse as jest.Mock,
      remove: courseDb.removeCourse as jest.Mock,
    },
    createdMessage: "Curso criado.",
    replayedMessage: "Este curso já havia sido criado.",
    invalidIdMessage: "Curso inválido.",
    createFailedMessage: "Não foi possível criar o curso.",
  },
  {
    label: "space",
    path: "/spaces",
    scope: "space.create",
    valid: {
      name: "Lab 1",
      floor: "1",
      capacity: "40",
      blocked: "false",
      space_type_id: "2",
    },
    invalid: {
      name: "Lab 1",
      floor: "1",
      capacity: "0",
      blocked: "false",
      space_type_id: "2",
    },
    invalidField: "capacity",
    create: spaceActions.createSpaceAction,
    update: spaceActions.updateSpaceAction,
    remove: spaceActions.deleteSpaceAction,
    db: {
      create: spaceDb.createSpace as jest.Mock,
      update: spaceDb.updateSpace as jest.Mock,
      remove: spaceDb.removeSpace as jest.Mock,
    },
    createdMessage: "Espaço criado.",
    replayedMessage: "Este espaço já havia sido criado.",
    invalidIdMessage: "Espaço inválido.",
    createFailedMessage: "Não foi possível criar o espaço.",
  },
  {
    label: "subject",
    path: "/subjects",
    scope: "subject.create",
    valid: {
      name: "Banco de Dados",
      required_space_type_id: "1",
      course_id: "2",
    },
    invalid: {
      name: "Banco de Dados",
      required_space_type_id: "1",
      course_id: "0",
    },
    invalidField: "course_id",
    create: subjectActions.createSubjectAction,
    update: subjectActions.updateSubjectAction,
    remove: subjectActions.deleteSubjectAction,
    db: {
      create: subjectDb.createSubject as jest.Mock,
      update: subjectDb.updateSubject as jest.Mock,
      remove: subjectDb.removeSubject as jest.Mock,
    },
    createdMessage: "Disciplina criada.",
    replayedMessage: "Esta disciplina já havia sido criada.",
    invalidIdMessage: "Disciplina inválida.",
    createFailedMessage: "Não foi possível criar a disciplina.",
  },
  {
    label: "class group",
    path: "/class_groups",
    scope: "class-group.create",
    valid: {
      name: "ADS 2024/1",
      semester: "2024.1",
      module: "1",
      student_count: "30",
      shift_id: "1",
      course_id: "2",
    },
    invalid: {
      name: "",
      semester: "2024.1",
      module: "1",
      student_count: "30",
      shift_id: "1",
      course_id: "2",
    },
    invalidField: "name",
    create: classGroupActions.createClassGroupAction,
    update: classGroupActions.updateClassGroupAction,
    remove: classGroupActions.deleteClassGroupAction,
    db: {
      create: classGroupDb.createClassGroup as jest.Mock,
      update: classGroupDb.updateClassGroup as jest.Mock,
      remove: classGroupDb.removeClassGroup as jest.Mock,
    },
    createdMessage: "Turma criada.",
    replayedMessage: "Esta turma já havia sido criada.",
    invalidIdMessage: "Turma inválida.",
    createFailedMessage: "Não foi possível criar a turma.",
  },
  {
    label: "schedule",
    path: "/schedules",
    scope: "schedule.create",
    valid: {
      weekday: "Monday",
      start_time: "07:30",
      end_time: "09:10",
      shift_id: "1",
    },
    invalid: {
      weekday: "Monday",
      start_time: "99:99",
      end_time: "09:10",
      shift_id: "1",
    },
    invalidField: "start_time",
    create: scheduleActions.createScheduleAction,
    update: scheduleActions.updateScheduleAction,
    remove: scheduleActions.deleteScheduleAction,
    db: {
      create: scheduleDb.createSchedule as jest.Mock,
      update: scheduleDb.updateSchedule as jest.Mock,
      remove: scheduleDb.removeSchedule as jest.Mock,
    },
    createdMessage: "Horário criado.",
    replayedMessage: "Este horário já havia sido criado.",
    invalidIdMessage: "Horário inválido.",
    createFailedMessage: "Não foi possível criar o horário.",
  },
  {
    label: "user",
    path: "/users",
    scope: "user.create",
    valid: { full_name: "Ana Souza", email: "ana@example.com", role: "admin" },
    invalid: { full_name: "", email: "ana@example.com" },
    invalidField: "full_name",
    create: userActions.createUserAction,
    update: userActions.updateUserAction,
    remove: userActions.deleteUserAction,
    db: {
      create: userDb.createUser as jest.Mock,
      update: userDb.updateUser as jest.Mock,
      remove: userDb.removeUser as jest.Mock,
    },
    createdMessage: "Usuário criado.",
    replayedMessage: "Este usuário já havia sido criado.",
    invalidIdMessage: "Usuário inválido.",
    createFailedMessage: "Não foi possível criar o usuário.",
  },
  {
    label: "teacher",
    path: "/teachers",
    scope: "teacher.create",
    valid: { full_name: "Ana Souza", email: "ana@example.com" },
    invalid: { full_name: "Ana Souza", email: "nao-e-email" },
    invalidField: "email",
    create: teacherActions.createTeacherAction,
    update: teacherActions.updateTeacherAction,
    remove: teacherActions.deleteTeacherAction,
    db: {
      create: userDb.createUser as jest.Mock,
      update: userDb.updateUser as jest.Mock,
      remove: userDb.removeUser as jest.Mock,
    },
    createdMessage: "Professor criado.",
    replayedMessage: "Este professor já havia sido criado.",
    invalidIdMessage: "Professor inválido.",
    createFailedMessage: "Não foi possível criar o professor.",
  },
  {
    label: "assignment",
    path: "/assignments",
    scope: "assignment.create",
    valid: { teacher_id: "1", subject_id: "2", class_group_id: "3" },
    invalid: { teacher_id: "0", subject_id: "2", class_group_id: "3" },
    invalidField: "teacher_id",
    create: assignmentActions.createAssignmentAction,
    update: assignmentActions.updateAssignmentAction,
    remove: assignmentActions.deleteAssignmentAction,
    db: {
      create: assignmentDb.createAssignment as jest.Mock,
      update: assignmentDb.updateAssignment as jest.Mock,
      remove: assignmentDb.removeAssignment as jest.Mock,
    },
    createdMessage: "Alocação criada.",
    replayedMessage: "Esta alocação já havia sido criada.",
    invalidIdMessage: "Alocação inválida.",
    createFailedMessage: "Não foi possível criar a alocação.",
  },
]

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

beforeEach(() => {
  // `clearMocks` only clears calls, not implementations. Users and teachers
  // share the same database mocks, so a rejection queued by one entity would
  // otherwise leak into the next one.
  for (const entity of entities) {
    entity.db.create.mockReset()
    entity.db.update.mockReset()
    entity.db.remove.mockReset()
  }

  mockRequireRole.mockResolvedValue({ userId: 1, role: "admin" })
  mockRunOnce.mockImplementation(async (_scope, _key, operation) => ({
    applied: true,
    result: await operation(),
  }))
})

describe.each(entities)("$label server actions", (entity) => {
  describe("create", () => {
    it("requires the admin role before touching the database", async () => {
      mockRequireRole.mockRejectedValue(new Error("REDIRECT:/error/403"))

      await expect(entity.create(undefined, form(entity.valid))).rejects.toThrow(
        "REDIRECT:/error/403",
      )
      expect(entity.db.create).not.toHaveBeenCalled()
    })

    it("checks for admin, not merely coordinator", async () => {
      await entity.create(undefined, form(entity.valid))

      expect(mockRequireRole).toHaveBeenCalledWith("admin")
    })

    it("creates the record and revalidates the list", async () => {
      const state = await entity.create(undefined, form(entity.valid))

      expect(entity.db.create).toHaveBeenCalledTimes(1)
      expect(mockRevalidatePath).toHaveBeenCalledWith(entity.path)
      expect(state).toMatchObject({
        success: true,
        message: entity.createdMessage,
      })
    })

    it("rejects an invalid payload without touching the database", async () => {
      const state = await entity.create(undefined, form(entity.invalid))

      expect(state.errors?.[entity.invalidField]).toBeDefined()
      expect(state.success).toBeUndefined()
      expect(entity.db.create).not.toHaveBeenCalled()
    })

    it("passes the idempotency key to the deduplication helper", async () => {
      await entity.create(
        undefined,
        form({ ...entity.valid, idempotencyKey: "key-1" }),
      )

      expect(mockRunOnce).toHaveBeenCalledWith(
        entity.scope,
        "key-1",
        expect.any(Function),
      )
    })

    it("reports a replayed submission instead of duplicating", async () => {
      mockRunOnce.mockResolvedValue({ applied: false })

      const state = await entity.create(
        undefined,
        form({ ...entity.valid, idempotencyKey: "key-1" }),
      )

      expect(state).toMatchObject({
        success: true,
        message: entity.replayedMessage,
      })
      expect(entity.db.create).not.toHaveBeenCalled()
    })

    it("surfaces a domain error as a form message", async () => {
      mockRunOnce.mockRejectedValue(new ConflictError("Já existe"))

      const state = await entity.create(undefined, form(entity.valid))

      expect(state.message).toBe("Já existe")
      expect(state.success).toBeUndefined()
    })

    it("hides unexpected failures behind a generic message", async () => {
      mockRunOnce.mockRejectedValue(new Error("ECONNREFUSED 10.0.0.1:3306"))

      const state = await entity.create(undefined, form(entity.valid))

      expect(state.message).toBe(entity.createFailedMessage)
      expect(state.message).not.toContain("ECONNREFUSED")
    })
  })

  describe("update", () => {
    it("requires the admin role", async () => {
      await entity.update(undefined, form({ ...entity.valid, id: "3" }))

      expect(mockRequireRole).toHaveBeenCalledWith("admin")
    })

    it("updates the record and revalidates", async () => {
      const state = await entity.update(
        undefined,
        form({ ...entity.valid, id: "3" }),
      )

      expect(entity.db.update).toHaveBeenCalledWith(3, expect.any(Object))
      expect(mockRevalidatePath).toHaveBeenCalledWith(entity.path)
      expect(state.success).toBe(true)
    })

    it.each(["", "abc", "0", "-1", "1.5"])(
      "refuses the invalid id %p",
      async (id) => {
        const state = await entity.update(
          undefined,
          form({ ...entity.valid, id }),
        )

        expect(state.message).toBe(entity.invalidIdMessage)
        expect(entity.db.update).not.toHaveBeenCalled()
      },
    )

    it("rejects an invalid payload", async () => {
      const state = await entity.update(
        undefined,
        form({ ...entity.invalid, id: "3" }),
      )

      expect(state.errors?.[entity.invalidField]).toBeDefined()
      expect(entity.db.update).not.toHaveBeenCalled()
    })

    it("reports a record that no longer exists", async () => {
      entity.db.update.mockRejectedValue(new NotFoundError("Not found"))

      const state = await entity.update(
        undefined,
        form({ ...entity.valid, id: "3" }),
      )

      expect(state.message).toBe("Not found")
    })
  })

  describe("delete", () => {
    it("requires the admin role", async () => {
      await entity.remove(undefined, form({ id: "3" }))

      expect(mockRequireRole).toHaveBeenCalledWith("admin")
    })

    it("deletes the record and revalidates", async () => {
      const state = await entity.remove(undefined, form({ id: "3" }))

      expect(entity.db.remove).toHaveBeenCalledWith(3)
      expect(mockRevalidatePath).toHaveBeenCalledWith(entity.path)
      expect(state.success).toBe(true)
    })

    it("is idempotent: deleting twice still reports success", async () => {
      entity.db.remove.mockRejectedValue(new NotFoundError("Not found"))

      const state = await entity.remove(undefined, form({ id: "3" }))

      expect(state.success).toBe(true)
    })

    it("still reports an unexpected failure", async () => {
      entity.db.remove.mockRejectedValue(new Error("connection lost"))

      const state = await entity.remove(undefined, form({ id: "3" }))

      expect(state.success).toBeUndefined()
      expect(state.message).toContain("Não foi possível excluir")
    })

    it("refuses an invalid id", async () => {
      const state = await entity.remove(undefined, form({ id: "abc" }))

      expect(state.message).toBe(entity.invalidIdMessage)
      expect(entity.db.remove).not.toHaveBeenCalled()
    })
  })
})
