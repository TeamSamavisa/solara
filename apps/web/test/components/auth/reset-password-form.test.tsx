/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { resetPassword } from "@/app/actions/auth"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

jest.mock("@/app/actions/auth", () => ({ resetPassword: jest.fn() }))

const mockReset = resetPassword as jest.MockedFunction<typeof resetPassword>

beforeEach(() => {
  mockReset.mockReset()
  mockReset.mockResolvedValue({})
})

describe("ResetPasswordForm rendering", () => {
  it("renders the password fields and the submit button", () => {
    render(<ResetPasswordForm token="plain-token" />)

    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Redefinir senha" })
    ).toBeInTheDocument()
  })

  it("carries the token as a hidden field", () => {
    const { container } = render(<ResetPasswordForm token="plain-token" />)

    expect(container.querySelector('input[name="token"]')).toHaveValue(
      "plain-token"
    )
  })
})

describe("ResetPasswordForm submission", () => {
  it("sends the token and the new password to the server action", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm token="plain-token" />)

    await user.type(screen.getByLabelText("Nova senha"), "secret123")
    await user.type(screen.getByLabelText("Confirmar senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    expect(mockReset).toHaveBeenCalledTimes(1)
    const formData = mockReset.mock.calls[0][1]
    expect(formData.get("token")).toBe("plain-token")
    expect(formData.get("password")).toBe("secret123")
    expect(formData.get("confirmPassword")).toBe("secret123")
  })

  it("shows a mismatch error on the confirmation field", async () => {
    mockReset.mockResolvedValue({
      errors: { confirmPassword: ["As senhas não coincidem."] },
    })
    const user = userEvent.setup()
    render(<ResetPasswordForm token="plain-token" />)

    await user.type(screen.getByLabelText("Nova senha"), "secret123")
    await user.type(screen.getByLabelText("Confirmar senha"), "different")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    expect(
      await screen.findByText("As senhas não coincidem.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Confirmar senha")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  it("announces an invalid or expired token as an alert", async () => {
    mockReset.mockResolvedValue({
      message: "Token de recuperação inválido ou expirado.",
    })
    const user = userEvent.setup()
    render(<ResetPasswordForm token="stale-token" />)

    await user.type(screen.getByLabelText("Nova senha"), "secret123")
    await user.type(screen.getByLabelText("Confirmar senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(
      "Token de recuperação inválido ou expirado."
    )
  })
})
