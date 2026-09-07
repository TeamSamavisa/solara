"use server"

import { revalidatePath } from "next/cache"

import { requireRole, verifySession } from "@/lib/auth/dal"
import { setTeacherAvailability } from "@/lib/db/actions/schedule-teachers"
import { errorToFormState, type FormState } from "@/lib/forms"

const FAILED = "Não foi possível atualizar a disponibilidade."

/**
 * Toggles the availability of the signed-in teacher.
 *
 * The teacher id always comes from the session, so this can never be used to
 * change somebody else's availability.
 */
export async function setOwnAvailabilityAction(
  scheduleId: number,
  available: boolean,
): Promise<FormState> {
  const session = await verifySession()

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    return { message: "Horário inválido." }
  }

  try {
    await setTeacherAvailability(session.userId, scheduleId, available)
    revalidatePath("/availability")

    return { success: true }
  } catch (error) {
    return errorToFormState(error, FAILED)
  }
}

/** Lets an admin manage the availability of a given teacher. */
export async function setTeacherAvailabilityAction(
  teacherId: number,
  scheduleId: number,
  available: boolean,
): Promise<FormState> {
  await requireRole("admin")

  if (
    !Number.isInteger(teacherId) ||
    teacherId <= 0 ||
    !Number.isInteger(scheduleId) ||
    scheduleId <= 0
  ) {
    return { message: "Professor ou horário inválido." }
  }

  try {
    await setTeacherAvailability(teacherId, scheduleId, available)
    revalidatePath("/teachers")

    return { success: true }
  } catch (error) {
    return errorToFormState(error, FAILED)
  }
}
