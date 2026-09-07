"use server"

import { revalidatePath } from "next/cache"

import { verifySession } from "@/lib/auth/dal"
import { updateUser } from "@solara/db/actions/users"
import { updateProfileSchema } from "@solara/db/schemas"
import {
  errorToFormState,
  readOptionalString,
  readString,
  toFieldErrors,
  type FormState,
} from "@/lib/forms"

export type ProfileFormState = FormState<
  "full_name" | "email" | "registration" | "password" | "confirmPassword"
>

/**
 * Updates the signed-in user's own record.
 *
 * Two properties make this safe for any role: the id comes from the session
 * (never from the form) and the schema has no `role` field, so privileges
 * cannot be escalated.
 */
export async function updateProfileAction(
  _state: ProfileFormState | undefined,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await verifySession()

  const parsed = updateProfileSchema.safeParse({
    full_name: readString(formData, "full_name").trim(),
    email: readString(formData, "email").trim(),
    registration: readOptionalString(formData, "registration"),
    password: readOptionalString(formData, "password"),
    confirmPassword: readOptionalString(formData, "confirmPassword"),
  })

  if (!parsed.success) {
    return { errors: toFieldErrors(parsed.error) }
  }

  // Listed explicitly so only these four fields can ever reach the database.
  const { full_name, email, registration, password } = parsed.data

  try {
    await updateUser(session.userId, {
      full_name,
      email,
      registration,
      password,
    })
    revalidatePath("/profile")

    return { success: true, message: "Perfil atualizado." }
  } catch (error) {
    return errorToFormState(error, "Não foi possível atualizar o perfil.")
  }
}
