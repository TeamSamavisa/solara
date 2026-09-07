import { datetime } from "drizzle-orm/mysql-core"
import { z } from "zod"

/**
 * Sequelize managed `createdAt`/`updatedAt` on every model except `tasks`,
 * which declared snake_case columns explicitly. Returned from a function so
 * each table gets its own column builder instances.
 */
export const timestamps = () => ({
  createdAt: datetime("createdAt").notNull().defaultNow(),
  updatedAt: datetime("updatedAt").notNull().defaultNow().onUpdateNow(),
})

/**
 * Validation conventions ported from the legacy API:
 *
 * - request bodies were validated by `class-validator` with no transform, so
 *   the create/update schemas keep strict types and reject numeric strings;
 * - query strings went through `@Type(() => Number)`, so the list schemas
 *   coerce their values.
 */
export const paginationFields = {
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
}

export const baseQuerySchema = z.object(paginationFields)
export type BaseQuery = z.infer<typeof baseQuerySchema>

/**
 * Legacy `@IsInt() @IsPositive()` on a request body.
 *
 * The message is attached at every level because an empty numeric field
 * arrives as `NaN`, which would otherwise fall back to zod's English default.
 */
export const requiredId = (error: string) =>
  z.number({ error }).int({ error }).positive({ error })

/** Any integer, including zero and negatives (e.g. a building floor). */
export const requiredInt = (error: string) =>
  z.number({ error }).int({ error })

/** Legacy `@IsString() @MinLength(1)` on a request body. */
export const requiredText = (error: string) =>
  z.string({ error }).min(1, { error })

/** Legacy `@IsOptional() @Type(() => Number) @IsInt() @IsPositive()`. */
export const optionalIdFilter = z.coerce.number().int().positive().optional()

/** Legacy `@IsOptional() @IsString()`. */
export const optionalTextFilter = z.string().optional()

/**
 * Legacy used `@Type(() => Boolean)`, which turns any non-empty string into
 * `true` (so `?blocked=false` meant `true`). That is corrected here.
 */
export const optionalBooleanFilter = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1")
  .optional()

/** `HH:MM` in 24h form, as enforced by the legacy `@Matches` decorator. */
export const TIME_PATTERN = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
