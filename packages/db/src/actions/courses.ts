import { asc, count, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  courses,
  courseTypes,
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
  type Course,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Curso não encontrado."

export type ListCoursesQueryInput = z.input<typeof listCoursesQuerySchema>

const courseSelection = {
  id: courses.id,
  name: courses.name,
  course_type_id: courses.course_type_id,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
  courseType: {
    id: courseTypes.id,
    name: courseTypes.name,
  },
}

function selectCourses() {
  return db
    .select(courseSelection)
    .from(courses)
    .leftJoin(courseTypes, eq(courses.course_type_id, courseTypes.id))
}

export type CourseWithType = Awaited<ReturnType<typeof selectCourses>>[number]

export async function createCourse(
  input: CreateCourseInput,
): Promise<CourseWithType> {
  const data = createCourseSchema.parse(input)

  const [inserted] = await db.insert(courses).values(data).$returningId()

  return getCourseById(inserted.id)
}

export async function listCourses(
  query: ListCoursesQueryInput = {},
): Promise<PaginatedResponse<CourseWithType>> {
  const { limit, page, ...filters } = listCoursesQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(courses.name, filters.name),
    filterEq(courses.course_type_id, filters.course_type_id),
  ])

  const rows = await selectCourses()
    .where(where)
    .orderBy(asc(courses.name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(courses)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getCourseById(id: number): Promise<CourseWithType> {
  const [row] = await selectCourses().where(eq(courses.id, id)).limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateCourse(
  id: number,
  input: UpdateCourseInput,
): Promise<CourseWithType> {
  const data = pickDefined(updateCourseSchema.parse(input))

  await ensureCourseExists(id)

  if (hasUpdates(data)) {
    await db.update(courses).set(data).where(eq(courses.id, id))
  }

  return getCourseById(id)
}

export async function removeCourse(id: number): Promise<Course> {
  const [row] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1)

  const course = requireFound(row, NOT_FOUND)

  await db.delete(courses).where(eq(courses.id, id))

  return course
}

async function ensureCourseExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
