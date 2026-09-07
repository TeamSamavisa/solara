import { z, type ZodError } from "zod"

import { ConflictError, NotFoundError } from "@solara/db/errors"

/** Shape returned by every form server action, consumed by `useActionState`. */
export interface FormState<TField extends string = string> {
  errors?: Partial<Record<TField, string[]>>
  /** Form-level message, e.g. a conflict reported by the database. */
  message?: string
  success?: boolean
}

export function toFieldErrors<TField extends string>(
  error: ZodError,
): Partial<Record<TField, string[]>> {
  return z.flattenError(error).fieldErrors as Partial<Record<TField, string[]>>
}

/**
 * Turns a domain error into a message the form can show. Anything unexpected
 * falls back to a generic message so internals are never leaked to the client.
 */
export function errorToFormState<TField extends string>(
  error: unknown,
  fallback: string,
): FormState<TField> {
  if (error instanceof ConflictError || error instanceof NotFoundError) {
    return { message: error.message }
  }

  return { message: fallback }
}

/**
 * `FormData` values are always strings, so these readers normalise them into
 * the shapes the zod schemas expect. Empty fields become `undefined` so that
 * optional properties stay absent instead of failing validation as `""`.
 */
export function readString(formData: FormData, key: string): string {
  const value = formData.get(key)

  return typeof value === "string" ? value : ""
}

export function readOptionalString(
  formData: FormData,
  key: string,
): string | undefined {
  const value = readString(formData, key).trim()

  return value === "" ? undefined : value
}

export function readNumber(formData: FormData, key: string): number {
  const value = readString(formData, key).trim()

  // `Number("")` is 0, which would silently turn a missing field into a valid
  // number. NaN makes zod reject it instead.
  return value === "" ? Number.NaN : Number(value)
}

export function readOptionalNumber(
  formData: FormData,
  key: string,
): number | undefined {
  const value = readOptionalString(formData, key)

  return value === undefined ? undefined : Number(value)
}

/**
 * Unchecked checkboxes are simply absent from `FormData`; a checked one sends
 * `"on"` unless an explicit value is set.
 */
export function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key)

  if (value === null) return false

  return value !== "false" && value !== "0"
}

/**
 * Repeated fields (a checkbox group) as numbers. Returns `undefined` when the
 * group is absent so an optional array stays optional.
 */
export function readNumberArray(
  formData: FormData,
  key: string,
): number[] | undefined {
  const values = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .filter((value) => value.trim() !== "")

  if (values.length === 0) return undefined

  return values.map(Number)
}
