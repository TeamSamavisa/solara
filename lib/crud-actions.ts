import "server-only"

import { revalidatePath } from "next/cache"
import type { ZodType } from "zod"

import { requireRole } from "@/lib/auth/dal"
import type { Role } from "@/lib/auth/roles"
import { NotFoundError } from "@/lib/db/errors"
import { runOnce } from "@/lib/db/idempotency"
import {
  errorToFormState,
  readNumber,
  readOptionalString,
  toFieldErrors,
  type FormState,
} from "@/lib/forms"

export interface CrudLabels {
  created: string
  replayed: string
  updated: string
  deleted: string
  invalidId: string
  createFailed: string
  updateFailed: string
  deleteFailed: string
}

export interface CrudConfig<TCreate, TUpdate> {
  /** Path revalidated after every successful mutation. */
  path: string
  /** Idempotency scope, e.g. `"course.create"`. */
  scope: string
  /** Minimum role required to mutate. */
  role: Role
  createSchema: ZodType<TCreate>
  updateSchema: ZodType<TUpdate>
  /**
   * Maps the raw form into the shape the schemas expect. `mode` lets a screen
   * send a field only on creation, e.g. a fixed role.
   */
  readForm: (formData: FormData, mode: "create" | "update") => unknown
  create: (input: TCreate) => Promise<unknown>
  update: (id: number, input: TUpdate) => Promise<unknown>
  remove: (id: number) => Promise<unknown>
  labels: CrudLabels
}

export interface CrudHandlers {
  create: (
    state: FormState | undefined,
    formData: FormData,
  ) => Promise<FormState>
  update: (
    state: FormState | undefined,
    formData: FormData,
  ) => Promise<FormState>
  remove: (
    state: FormState | undefined,
    formData: FormData,
  ) => Promise<FormState>
}

function readId(formData: FormData): number | null {
  const id = readNumber(formData, "id")

  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Builds the create/update/delete server-action bodies shared by the CRUD
 * screens: authorize, validate, mutate, revalidate — with idempotent creates
 * and idempotent deletes.
 */
export function createCrudHandlers<TCreate, TUpdate>(
  config: CrudConfig<TCreate, TUpdate>,
): CrudHandlers {
  const { labels } = config

  return {
    async create(_state, formData) {
      await requireRole(config.role)

      const parsed = config.createSchema.safeParse(
        config.readForm(formData, "create"),
      )

      if (!parsed.success) {
        return { errors: toFieldErrors(parsed.error) }
      }

      try {
        const outcome = await runOnce(
          config.scope,
          readOptionalString(formData, "idempotencyKey"),
          () => config.create(parsed.data),
        )

        revalidatePath(config.path)

        return {
          success: true,
          message: outcome.applied ? labels.created : labels.replayed,
        }
      } catch (error) {
        return errorToFormState(error, labels.createFailed)
      }
    },

    async update(_state, formData) {
      await requireRole(config.role)

      const id = readId(formData)

      if (id === null) {
        return { message: labels.invalidId }
      }

      const parsed = config.updateSchema.safeParse(
        config.readForm(formData, "update"),
      )

      if (!parsed.success) {
        return { errors: toFieldErrors(parsed.error) }
      }

      try {
        await config.update(id, parsed.data)
        revalidatePath(config.path)

        return { success: true, message: labels.updated }
      } catch (error) {
        return errorToFormState(error, labels.updateFailed)
      }
    },

    async remove(_state, formData) {
      await requireRole(config.role)

      const id = readId(formData)

      if (id === null) {
        return { message: labels.invalidId }
      }

      try {
        await config.remove(id)
      } catch (error) {
        // Deleting something already gone is the state the user asked for.
        if (!(error instanceof NotFoundError)) {
          return errorToFormState(error, labels.deleteFailed)
        }
      }

      revalidatePath(config.path)

      return { success: true, message: labels.deleted }
    },
  }
}
