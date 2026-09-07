import { and, count, desc, eq, inArray } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  createScheduleTeacherSchema,
  listScheduleTeachersQuerySchema,
  scheduleTeachers,
  schedules,
  updateScheduleTeacherSchema,
  users,
  type CreateScheduleTeacherInput,
  type ScheduleTeacher,
  type UpdateScheduleTeacherInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Disponibilidade não encontrada."

export type ListScheduleTeachersQueryInput = z.input<
  typeof listScheduleTeachersQuerySchema
>

const scheduleTeacherSelection = {
  id: scheduleTeachers.id,
  schedule_id: scheduleTeachers.schedule_id,
  teacher_id: scheduleTeachers.teacher_id,
  createdAt: scheduleTeachers.createdAt,
  updatedAt: scheduleTeachers.updatedAt,
  schedule: {
    id: schedules.id,
    weekday: schedules.weekday,
    start_time: schedules.start_time,
    end_time: schedules.end_time,
    shift_id: schedules.shift_id,
  },
  teacher: {
    id: users.id,
    full_name: users.full_name,
    email: users.email,
    role: users.role,
  },
}

function selectScheduleTeachers() {
  return db
    .select(scheduleTeacherSelection)
    .from(scheduleTeachers)
    .leftJoin(schedules, eq(scheduleTeachers.schedule_id, schedules.id))
    .leftJoin(users, eq(scheduleTeachers.teacher_id, users.id))
}

export type ScheduleTeacherWithRelations = Awaited<
  ReturnType<typeof selectScheduleTeachers>
>[number]

export async function createScheduleTeacher(
  input: CreateScheduleTeacherInput,
): Promise<ScheduleTeacherWithRelations> {
  const data = createScheduleTeacherSchema.parse(input)

  const [inserted] = await db
    .insert(scheduleTeachers)
    .values(data)
    .$returningId()

  return getScheduleTeacherById(inserted.id)
}

export async function listScheduleTeachers(
  query: ListScheduleTeachersQueryInput = {},
): Promise<PaginatedResponse<ScheduleTeacherWithRelations>> {
  const { limit, page, ...filters } =
    listScheduleTeachersQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(scheduleTeachers.schedule_id, filters.schedule_id),
    filterEq(scheduleTeachers.teacher_id, filters.teacher_id),
  ])

  const rows = await selectScheduleTeachers()
    .where(where)
    .orderBy(desc(scheduleTeachers.createdAt))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(scheduleTeachers)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getScheduleTeacherById(
  id: number,
): Promise<ScheduleTeacherWithRelations> {
  const [row] = await selectScheduleTeachers()
    .where(eq(scheduleTeachers.id, id))
    .limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateScheduleTeacher(
  id: number,
  input: UpdateScheduleTeacherInput,
): Promise<ScheduleTeacherWithRelations> {
  const data = pickDefined(updateScheduleTeacherSchema.parse(input))

  await ensureScheduleTeacherExists(id)

  if (hasUpdates(data)) {
    await db
      .update(scheduleTeachers)
      .set(data)
      .where(eq(scheduleTeachers.id, id))
  }

  return getScheduleTeacherById(id)
}

export async function removeScheduleTeacher(
  id: number,
): Promise<ScheduleTeacher> {
  const [row] = await db
    .select()
    .from(scheduleTeachers)
    .where(eq(scheduleTeachers.id, id))
    .limit(1)

  const scheduleTeacher = requireFound(row, NOT_FOUND)

  await db.delete(scheduleTeachers).where(eq(scheduleTeachers.id, id))

  return scheduleTeacher
}

/**
 * Declares whether a teacher is available in a schedule.
 *
 * Idempotent on purpose: the availability grid updates optimistically, so the
 * same toggle can arrive twice without creating a duplicate row or failing on
 * an already removed one. Returns `true` when something actually changed.
 */
export async function setTeacherAvailability(
  teacherId: number,
  scheduleId: number,
  available: boolean,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: scheduleTeachers.id })
    .from(scheduleTeachers)
    .where(
      and(
        eq(scheduleTeachers.teacher_id, teacherId),
        eq(scheduleTeachers.schedule_id, scheduleId),
      ),
    )
    .limit(1)

  if (available) {
    if (existing) return false

    await db
      .insert(scheduleTeachers)
      .values({ teacher_id: teacherId, schedule_id: scheduleId })

    return true
  }

  if (!existing) return false

  await db.delete(scheduleTeachers).where(eq(scheduleTeachers.id, existing.id))

  return true
}

/** Schedule ids a teacher declared availability for. */
export async function listTeacherAvailability(
  teacherId: number,
): Promise<number[]> {
  const rows = await db
    .select({ schedule_id: scheduleTeachers.schedule_id })
    .from(scheduleTeachers)
    .where(eq(scheduleTeachers.teacher_id, teacherId))

  return rows
    .map((row) => row.schedule_id)
    .filter((id): id is number => id !== null)
}

/** Availability of several teachers at once, to avoid a query per row. */
export async function listAvailabilityByTeacher(
  teacherIds: number[],
): Promise<Map<number, number[]>> {
  const grouped = new Map<number, number[]>()

  if (teacherIds.length === 0) return grouped

  const rows = await db
    .select({
      teacher_id: scheduleTeachers.teacher_id,
      schedule_id: scheduleTeachers.schedule_id,
    })
    .from(scheduleTeachers)
    .where(inArray(scheduleTeachers.teacher_id, teacherIds))

  for (const row of rows) {
    if (row.teacher_id === null || row.schedule_id === null) continue

    const current = grouped.get(row.teacher_id) ?? []
    current.push(row.schedule_id)
    grouped.set(row.teacher_id, current)
  }

  return grouped
}

async function ensureScheduleTeacherExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: scheduleTeachers.id })
    .from(scheduleTeachers)
    .where(eq(scheduleTeachers.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
