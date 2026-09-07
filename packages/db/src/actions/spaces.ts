import { asc, count, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  createSpaceSchema,
  listSpacesQuerySchema,
  spaces,
  spaceTypes,
  updateSpaceSchema,
  type CreateSpaceInput,
  type Space,
  type UpdateSpaceInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Espaço não encontrado."

export type ListSpacesQueryInput = z.input<typeof listSpacesQuerySchema>

const spaceSelection = {
  id: spaces.id,
  name: spaces.name,
  floor: spaces.floor,
  capacity: spaces.capacity,
  blocked: spaces.blocked,
  space_type_id: spaces.space_type_id,
  createdAt: spaces.createdAt,
  updatedAt: spaces.updatedAt,
  spaceType: {
    id: spaceTypes.id,
    name: spaceTypes.name,
  },
}

function selectSpaces() {
  return db
    .select(spaceSelection)
    .from(spaces)
    .leftJoin(spaceTypes, eq(spaces.space_type_id, spaceTypes.id))
}

export type SpaceWithType = Awaited<ReturnType<typeof selectSpaces>>[number]

export async function createSpace(
  input: CreateSpaceInput,
): Promise<SpaceWithType> {
  const data = createSpaceSchema.parse(input)

  const [inserted] = await db.insert(spaces).values(data).$returningId()

  return getSpaceById(inserted.id)
}

export async function listSpaces(
  query: ListSpacesQueryInput = {},
): Promise<PaginatedResponse<SpaceWithType>> {
  const { limit, page, ...filters } = listSpacesQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(spaces.name, filters.name),
    filterEq(spaces.floor, filters.floor),
    filterEq(spaces.capacity, filters.capacity),
    filterEq(spaces.blocked, filters.blocked),
    filterEq(spaces.space_type_id, filters.space_type_id),
  ])

  const rows = await selectSpaces()
    .where(where)
    .orderBy(asc(spaces.name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db.select({ value: count() }).from(spaces).where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getSpaceById(id: number): Promise<SpaceWithType> {
  const [row] = await selectSpaces().where(eq(spaces.id, id)).limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateSpace(
  id: number,
  input: UpdateSpaceInput,
): Promise<SpaceWithType> {
  const data = pickDefined(updateSpaceSchema.parse(input))

  await ensureSpaceExists(id)

  if (hasUpdates(data)) {
    await db.update(spaces).set(data).where(eq(spaces.id, id))
  }

  return getSpaceById(id)
}

export async function removeSpace(id: number): Promise<Space> {
  const [row] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, id))
    .limit(1)

  const space = requireFound(row, NOT_FOUND)

  await db.delete(spaces).where(eq(spaces.id, id))

  return space
}

async function ensureSpaceExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(eq(spaces.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
