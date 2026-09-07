import { count, desc, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  createShiftSchema,
  listShiftsQuerySchema,
  shifts,
  updateShiftSchema,
  type CreateShiftInput,
  type Shift,
  type UpdateShiftInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Turno não encontrado."

export type ListShiftsQueryInput = z.input<typeof listShiftsQuerySchema>

export async function createShift(
  input: CreateShiftInput,
): Promise<Shift> {
  const data = createShiftSchema.parse(input)

  const [inserted] = await db.insert(shifts).values(data).$returningId()

  return getShiftById(inserted.id)
}

export async function listShifts(
  query: ListShiftsQueryInput = {},
): Promise<PaginatedResponse<Shift>> {
  const { limit, page, ...filters } = listShiftsQuerySchema.parse(query)

  const where = buildWhere([filterEq(shifts.name, filters.name)])

  const rows = await db
    .select()
    .from(shifts)
    .where(where)
    .orderBy(desc(shifts.createdAt))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db.select({ value: count() }).from(shifts).where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getShiftById(id: number): Promise<Shift> {
  const [row] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, id))
    .limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateShift(
  id: number,
  input: UpdateShiftInput,
): Promise<Shift> {
  const data = pickDefined(updateShiftSchema.parse(input))

  await getShiftById(id)

  if (hasUpdates(data)) {
    await db.update(shifts).set(data).where(eq(shifts.id, id))
  }

  return getShiftById(id)
}

export async function removeShift(id: number): Promise<Shift> {
  const shift = await getShiftById(id)

  await db.delete(shifts).where(eq(shifts.id, id))

  return shift
}
