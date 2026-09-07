import { asc, count, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  courseTypes,
  createCourseTypeSchema,
  listCourseTypesQuerySchema,
  updateCourseTypeSchema,
  type CourseType,
  type CreateCourseTypeInput,
  type UpdateCourseTypeInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Tipo de curso não encontrado."

export type ListCourseTypesQueryInput = z.input<
  typeof listCourseTypesQuerySchema
>

export async function createCourseType(
  input: CreateCourseTypeInput,
): Promise<CourseType> {
  const data = createCourseTypeSchema.parse(input)

  const [inserted] = await db.insert(courseTypes).values(data).$returningId()

  return getCourseTypeById(inserted.id)
}

export async function listCourseTypes(
  query: ListCourseTypesQueryInput = {},
): Promise<PaginatedResponse<CourseType>> {
  const { limit, page, ...filters } = listCourseTypesQuerySchema.parse(query)

  const where = buildWhere([filterEq(courseTypes.name, filters.name)])

  const rows = await db
    .select()
    .from(courseTypes)
    .where(where)
    .orderBy(asc(courseTypes.name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(courseTypes)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getCourseTypeById(id: number): Promise<CourseType> {
  const [row] = await db
    .select()
    .from(courseTypes)
    .where(eq(courseTypes.id, id))
    .limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateCourseType(
  id: number,
  input: UpdateCourseTypeInput,
): Promise<CourseType> {
  const data = pickDefined(updateCourseTypeSchema.parse(input))

  await getCourseTypeById(id)

  if (hasUpdates(data)) {
    await db.update(courseTypes).set(data).where(eq(courseTypes.id, id))
  }

  return getCourseTypeById(id)
}

export async function removeCourseType(id: number): Promise<CourseType> {
  const courseType = await getCourseTypeById(id)

  await db.delete(courseTypes).where(eq(courseTypes.id, id))

  return courseType
}
