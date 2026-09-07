import { asc, count, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  classGroups,
  courses,
  createClassGroupSchema,
  listClassGroupsQuerySchema,
  shifts,
  updateClassGroupSchema,
  type ClassGroup,
  type CreateClassGroupInput,
  type UpdateClassGroupInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Turma não encontrada."

export type ListClassGroupsQueryInput = z.input<
  typeof listClassGroupsQuerySchema
>

const classGroupSelection = {
  id: classGroups.id,
  name: classGroups.name,
  semester: classGroups.semester,
  module: classGroups.module,
  student_count: classGroups.student_count,
  shift_id: classGroups.shift_id,
  course_id: classGroups.course_id,
  createdAt: classGroups.createdAt,
  updatedAt: classGroups.updatedAt,
  shift: {
    id: shifts.id,
    name: shifts.name,
  },
  course: {
    id: courses.id,
    name: courses.name,
  },
}

function selectClassGroups() {
  return db
    .select(classGroupSelection)
    .from(classGroups)
    .leftJoin(shifts, eq(classGroups.shift_id, shifts.id))
    .leftJoin(courses, eq(classGroups.course_id, courses.id))
}

export type ClassGroupWithRelations = Awaited<
  ReturnType<typeof selectClassGroups>
>[number]

export async function createClassGroup(
  input: CreateClassGroupInput,
): Promise<ClassGroupWithRelations> {
  const data = createClassGroupSchema.parse(input)

  const [inserted] = await db.insert(classGroups).values(data).$returningId()

  return getClassGroupById(inserted.id)
}

export async function listClassGroups(
  query: ListClassGroupsQueryInput = {},
): Promise<PaginatedResponse<ClassGroupWithRelations>> {
  const { limit, page, ...filters } = listClassGroupsQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(classGroups.name, filters.name),
    filterEq(classGroups.semester, filters.semester),
    filterEq(classGroups.module, filters.module),
    filterEq(classGroups.student_count, filters.student_count),
    filterEq(classGroups.shift_id, filters.shift_id),
    filterEq(classGroups.course_id, filters.course_id),
  ])

  const rows = await selectClassGroups()
    .where(where)
    .orderBy(asc(classGroups.name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(classGroups)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getClassGroupById(
  id: number,
): Promise<ClassGroupWithRelations> {
  const [row] = await selectClassGroups().where(eq(classGroups.id, id)).limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateClassGroup(
  id: number,
  input: UpdateClassGroupInput,
): Promise<ClassGroupWithRelations> {
  const data = pickDefined(updateClassGroupSchema.parse(input))

  await ensureClassGroupExists(id)

  if (hasUpdates(data)) {
    await db.update(classGroups).set(data).where(eq(classGroups.id, id))
  }

  return getClassGroupById(id)
}

export async function removeClassGroup(id: number): Promise<ClassGroup> {
  const [row] = await db
    .select()
    .from(classGroups)
    .where(eq(classGroups.id, id))
    .limit(1)

  const classGroup = requireFound(row, NOT_FOUND)

  await db.delete(classGroups).where(eq(classGroups.id, id))

  return classGroup
}

async function ensureClassGroupExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: classGroups.id })
    .from(classGroups)
    .where(eq(classGroups.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
