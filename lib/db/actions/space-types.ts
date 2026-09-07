import { asc, count, eq } from "drizzle-orm"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  createSpaceTypeSchema,
  listSpaceTypesQuerySchema,
  spaceTypes,
  updateSpaceTypeSchema,
  type CreateSpaceTypeInput,
  type SpaceType,
  type UpdateSpaceTypeInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Tipo de espaço não encontrado."

export type ListSpaceTypesQueryInput = z.input<typeof listSpaceTypesQuerySchema>

export async function createSpaceType(
  input: CreateSpaceTypeInput,
): Promise<SpaceType> {
  const data = createSpaceTypeSchema.parse(input)

  const [inserted] = await db.insert(spaceTypes).values(data).$returningId()

  return getSpaceTypeById(inserted.id)
}

export async function listSpaceTypes(
  query: ListSpaceTypesQueryInput = {},
): Promise<PaginatedResponse<SpaceType>> {
  const { limit, page, ...filters } = listSpaceTypesQuerySchema.parse(query)

  const where = buildWhere([filterEq(spaceTypes.name, filters.name)])

  const rows = await db
    .select()
    .from(spaceTypes)
    .where(where)
    .orderBy(asc(spaceTypes.name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(spaceTypes)
    .where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

export async function getSpaceTypeById(id: number): Promise<SpaceType> {
  const [row] = await db
    .select()
    .from(spaceTypes)
    .where(eq(spaceTypes.id, id))
    .limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateSpaceType(
  id: number,
  input: UpdateSpaceTypeInput,
): Promise<SpaceType> {
  const data = pickDefined(updateSpaceTypeSchema.parse(input))

  await getSpaceTypeById(id)

  if (hasUpdates(data)) {
    await db.update(spaceTypes).set(data).where(eq(spaceTypes.id, id))
  }

  return getSpaceTypeById(id)
}

export async function removeSpaceType(id: number): Promise<SpaceType> {
  const spaceType = await getSpaceTypeById(id)

  await db.delete(spaceTypes).where(eq(spaceTypes.id, id))

  return spaceType
}
