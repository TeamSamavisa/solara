import { count, desc, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  schedules,
  shifts,
  updateScheduleSchema,
  type CreateScheduleInput,
  type Schedule,
  type UpdateScheduleInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Horário não encontrado."

export type ListSchedulesQueryInput = z.input<typeof listSchedulesQuerySchema>

const scheduleSelection = {
  id: schedules.id,
  weekday: schedules.weekday,
  start_time: schedules.start_time,
  end_time: schedules.end_time,
  shift_id: schedules.shift_id,
  createdAt: schedules.createdAt,
  updatedAt: schedules.updatedAt,
  shift: {
    id: shifts.id,
    name: shifts.name,
  },
}

function selectSchedules() {
  return db
    .select(scheduleSelection)
    .from(schedules)
    .leftJoin(shifts, eq(schedules.shift_id, shifts.id))
}

export type ScheduleWithShift = Awaited<
  ReturnType<typeof selectSchedules>
>[number]

export async function createSchedule(
  input: CreateScheduleInput,
): Promise<ScheduleWithShift> {
  const data = createScheduleSchema.parse(input)

  const [inserted] = await db.insert(schedules).values(data).$returningId()

  return getScheduleById(inserted.id)
}

export async function listSchedules(
  query: ListSchedulesQueryInput = {},
): Promise<PaginatedResponse<ScheduleWithShift>> {
  const { limit, page, ...filters } = listSchedulesQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(schedules.weekday, filters.weekday),
    filterEq(schedules.start_time, filters.start_time),
    filterEq(schedules.end_time, filters.end_time),
  ])

  const rows = await selectSchedules()
    .where(where)
    .orderBy(desc(schedules.createdAt))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(schedules)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getScheduleById(
  id: number,
): Promise<ScheduleWithShift> {
  const [row] = await selectSchedules().where(eq(schedules.id, id)).limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateSchedule(
  id: number,
  input: UpdateScheduleInput,
): Promise<ScheduleWithShift> {
  const data = pickDefined(updateScheduleSchema.parse(input))

  await ensureScheduleExists(id)

  if (hasUpdates(data)) {
    await db.update(schedules).set(data).where(eq(schedules.id, id))
  }

  return getScheduleById(id)
}

export async function removeSchedule(id: number): Promise<Schedule> {
  const [row] = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id))
    .limit(1)

  const schedule = requireFound(row, NOT_FOUND)

  await db.delete(schedules).where(eq(schedules.id, id))

  return schedule
}

async function ensureScheduleExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(eq(schedules.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
