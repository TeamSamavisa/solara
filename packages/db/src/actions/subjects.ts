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
  createSubjectSchema,
  listSubjectsQuerySchema,
  spaceTypes,
  subjects,
  updateSubjectSchema,
  type CreateSubjectInput,
  type Subject,
  type UpdateSubjectInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Disciplina não encontrada."

export type ListSubjectsQueryInput = z.input<typeof listSubjectsQuerySchema>

const subjectSelection = {
  id: subjects.id,
  name: subjects.name,
  required_space_type_id: subjects.required_space_type_id,
  course_id: subjects.course_id,
  createdAt: subjects.createdAt,
  updatedAt: subjects.updatedAt,
  requiredSpaceType: {
    id: spaceTypes.id,
    name: spaceTypes.name,
  },
  course: {
    id: courses.id,
    name: courses.name,
  },
}

function selectSubjects() {
  return db
    .select(subjectSelection)
    .from(subjects)
    .leftJoin(spaceTypes, eq(subjects.required_space_type_id, spaceTypes.id))
    .leftJoin(courses, eq(subjects.course_id, courses.id))
}

export type SubjectWithRelations = Awaited<
  ReturnType<typeof selectSubjects>
>[number]

export async function createSubject(
  input: CreateSubjectInput,
): Promise<SubjectWithRelations> {
  const data = createSubjectSchema.parse(input)

  const [inserted] = await db.insert(subjects).values(data).$returningId()

  return getSubjectById(inserted.id)
}

export async function listSubjects(
  query: ListSubjectsQueryInput = {},
): Promise<PaginatedResponse<SubjectWithRelations>> {
  const { limit, page, ...filters } = listSubjectsQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(subjects.name, filters.name),
    filterEq(subjects.required_space_type_id, filters.required_space_type_id),
    filterEq(subjects.course_id, filters.course_id),
  ])

  const rows = await selectSubjects()
    .where(where)
    .orderBy(asc(subjects.name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(subjects)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getSubjectById(
  id: number,
): Promise<SubjectWithRelations> {
  const [row] = await selectSubjects().where(eq(subjects.id, id)).limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateSubject(
  id: number,
  input: UpdateSubjectInput,
): Promise<SubjectWithRelations> {
  const data = pickDefined(updateSubjectSchema.parse(input))

  await ensureSubjectExists(id)

  if (hasUpdates(data)) {
    await db.update(subjects).set(data).where(eq(subjects.id, id))
  }

  return getSubjectById(id)
}

export async function removeSubject(id: number): Promise<Subject> {
  const [row] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, id))
    .limit(1)

  const subject = requireFound(row, NOT_FOUND)

  await db.delete(subjects).where(eq(subjects.id, id))

  return subject
}

async function ensureSubjectExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
