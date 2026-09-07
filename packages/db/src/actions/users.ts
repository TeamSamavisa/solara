import { hash } from "bcryptjs"
import { and, asc, count, eq, inArray, ne, type SQL } from "drizzle-orm"
import { randomInt } from "node:crypto"
import type { z } from "zod"

import { db } from "../client"
import { ConflictError } from "../errors"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  createUserSchema,
  DEFAULT_USER_ROLE,
  listUsersQuerySchema,
  TEACHING_ROLES,
  updateUserSchema,
  users,
  type CreateUserInput,
  type NewUser,
  type PublicUser,
  type UpdateUserInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  requireFound,
} from "./utils"

const NOT_FOUND = "Usuário não encontrado."
const PASSWORD_SALT_ROUNDS = 10
const GENERATED_PASSWORD_LENGTH = 8
const PASSWORD_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*"

export type ListUsersQueryInput = z.input<typeof listUsersQuerySchema>

/** Every read goes through this projection so `password_hash` never leaks. */
const publicUserSelection = {
  id: users.id,
  full_name: users.full_name,
  registration: users.registration,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

/** Uses a CSPRNG instead of the `Math.random` of the legacy service. */
function generateRandomPassword(): string {
  let password = ""

  for (let index = 0; index < GENERATED_PASSWORD_LENGTH; index += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }

  return password
}

export async function createUser(
  input: CreateUserInput,
): Promise<PublicUser> {
  const data = createUserSchema.parse(input)

  await assertEmailIsAvailable(data.email)

  if (data.registration) {
    await assertRegistrationIsAvailable(data.registration)
  }

  const password = data.password || generateRandomPassword()

  const [inserted] = await db
    .insert(users)
    .values({
      full_name: data.full_name,
      email: data.email,
      registration: data.registration,
      role: data.role ?? DEFAULT_USER_ROLE,
      password_hash: await hash(password, PASSWORD_SALT_ROUNDS),
    })
    .$returningId()

  return getUserById(inserted.id)
}

export async function listUsers(
  query: ListUsersQueryInput = {},
): Promise<PaginatedResponse<PublicUser>> {
  return listUsersMatching(query, [])
}

/** Port of `GET /user/teachers`: teaching staff only. */
export async function listTeachers(
  query: ListUsersQueryInput = {},
): Promise<PaginatedResponse<PublicUser>> {
  return listUsersMatching(query, [inArray(users.role, [...TEACHING_ROLES])])
}

export async function getUserById(id: number): Promise<PublicUser> {
  const [row] = await db
    .select(publicUserSelection)
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return requireFound(row, NOT_FOUND)
}

/** Returns the password hash, so it is only meant for authentication. */
export async function getUserByEmail(email: string): Promise<{
  id: number
  email: string
  role: string
  password_hash: string
}> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      password_hash: users.password_hash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return requireFound(row, NOT_FOUND)
}

export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<PublicUser> {
  const data = updateUserSchema.parse(input)

  await ensureUserExists(id)

  if (data.email) await assertEmailIsAvailable(data.email, id)
  if (data.registration) {
    await assertRegistrationIsAvailable(data.registration, id)
  }

  const updateData: Partial<NewUser> = {}

  if (data.full_name !== undefined) updateData.full_name = data.full_name
  if (data.email) updateData.email = data.email
  if (data.registration) updateData.registration = data.registration
  if (data.role) updateData.role = data.role
  if (data.password) {
    updateData.password_hash = await hash(data.password, PASSWORD_SALT_ROUNDS)
  }

  if (hasUpdates(updateData)) {
    await db.update(users).set(updateData).where(eq(users.id, id))
  }

  return getUserById(id)
}

export async function removeUser(id: number): Promise<PublicUser> {
  const user = await getUserById(id)

  await db.delete(users).where(eq(users.id, id))

  return user
}

async function listUsersMatching(
  query: ListUsersQueryInput,
  extraFilters: Array<SQL | undefined>,
): Promise<PaginatedResponse<PublicUser>> {
  const { limit, page, ...filters } = listUsersQuerySchema.parse(query)

  const where = buildWhere([
    filterEq(users.full_name, filters.full_name),
    filterEq(users.email, filters.email),
    filterEq(users.registration, filters.registration),
    ...extraFilters,
  ])

  const rows = await db
    .select(publicUserSelection)
    .from(users)
    .where(where)
    .orderBy(asc(users.full_name))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db.select({ value: count() }).from(users).where(where)

  return paginate(rows, { page, limit }, total?.value ?? 0)
}

async function assertEmailIsAvailable(
  email: string,
  excludeId?: number,
): Promise<void> {
  const taken = await isTaken(users.email, email, excludeId)

  if (taken) throw new ConflictError("Este e-mail já está em uso.")
}

async function assertRegistrationIsAvailable(
  registration: string,
  excludeId?: number,
): Promise<void> {
  const taken = await isTaken(users.registration, registration, excludeId)

  if (taken) throw new ConflictError("Esta matrícula já está em uso.")
}

async function isTaken(
  column: typeof users.email | typeof users.registration,
  value: string,
  excludeId?: number,
): Promise<boolean> {
  const where =
    excludeId === undefined
      ? eq(column, value)
      : and(eq(column, value), ne(users.id, excludeId))

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(where)
    .limit(1)

  return existing !== undefined
}

async function ensureUserExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
