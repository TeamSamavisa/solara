import { revalidatePath } from "next/cache"

import { updateProfileAction } from "@/app/(authenticated)/profile/actions"
import { verifySession } from "@/lib/auth/dal"
import { updateUser } from "@solara/db/actions/users"
import { ConflictError } from "@solara/db/errors"

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }))
jest.mock("@/lib/auth/dal", () => ({ verifySession: jest.fn() }))
jest.mock("@solara/db/actions/users", () => ({ updateUser: jest.fn() }))

const mockVerifySession = verifySession as jest.MockedFunction<
  typeof verifySession
>
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

const valid = { full_name: "Ana Souza", email: "ana@example.com" }

beforeEach(() => {
  mockVerifySession.mockResolvedValue({ userId: 7, role: "teacher" })
})

describe("updateProfileAction", () => {
  it("updates the record identified by the session", async () => {
    const state = await updateProfileAction(undefined, form(valid))

    expect(mockUpdateUser).toHaveBeenCalledWith(7, {
      full_name: "Ana Souza",
      email: "ana@example.com",
      registration: undefined,
      password: undefined,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile")
    expect(state.success).toBe(true)
  })

  it("ignores an id smuggled through the form", async () => {
    await updateProfileAction(undefined, form({ ...valid, id: "1" }))

    expect(mockUpdateUser).toHaveBeenCalledWith(7, expect.any(Object))
  })

  it("cannot be used to escalate the caller's own role", async () => {
    await updateProfileAction(undefined, form({ ...valid, role: "admin" }))

    const [, payload] = mockUpdateUser.mock.calls[0]
    expect(payload).not.toHaveProperty("role")
  })

  it("works for a teacher, not only for admins", async () => {
    mockVerifySession.mockResolvedValue({ userId: 9, role: "teacher" })

    const state = await updateProfileAction(undefined, form(valid))

    expect(state.success).toBe(true)
    expect(mockUpdateUser).toHaveBeenCalledWith(9, expect.any(Object))
  })

  it("redirects an anonymous visitor before touching anything", async () => {
    mockVerifySession.mockRejectedValue(new Error("REDIRECT:/login"))

    await expect(
      updateProfileAction(undefined, form(valid)),
    ).rejects.toThrow("REDIRECT:/login")
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it("rejects an invalid email", async () => {
    const state = await updateProfileAction(
      undefined,
      form({ ...valid, email: "nope" }),
    )

    expect(state.errors?.email).toEqual(["Informe um e-mail válido."])
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it("requires the password confirmation to match", async () => {
    const state = await updateProfileAction(
      undefined,
      form({ ...valid, password: "novaSenha", confirmPassword: "outra" }),
    )

    expect(state.errors?.confirmPassword).toEqual(["As senhas não coincidem."])
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it("accepts a matching password and forwards it", async () => {
    const state = await updateProfileAction(
      undefined,
      form({ ...valid, password: "novaSenha", confirmPassword: "novaSenha" }),
    )

    expect(state.success).toBe(true)
    expect(mockUpdateUser).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ password: "novaSenha" }),
    )
  })

  it("never sends the confirmation field to the database", async () => {
    await updateProfileAction(
      undefined,
      form({ ...valid, password: "novaSenha", confirmPassword: "novaSenha" }),
    )

    const [, payload] = mockUpdateUser.mock.calls[0]
    expect(payload).not.toHaveProperty("confirmPassword")
  })

  it("leaves the password untouched when the field is blank", async () => {
    await updateProfileAction(
      undefined,
      form({ ...valid, password: "", confirmPassword: "" }),
    )

    expect(mockUpdateUser).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ password: undefined }),
    )
  })

  it("surfaces a duplicated email as a form message", async () => {
    mockUpdateUser.mockRejectedValue(new ConflictError("Este e-mail já está em uso."))

    const state = await updateProfileAction(undefined, form(valid))

    expect(state.message).toBe("Este e-mail já está em uso.")
  })

  it("hides unexpected failures", async () => {
    mockUpdateUser.mockRejectedValue(new Error("ECONNREFUSED"))

    const state = await updateProfileAction(undefined, form(valid))

    expect(state.message).toBe("Não foi possível atualizar o perfil.")
  })
})
