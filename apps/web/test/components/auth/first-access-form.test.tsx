/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { activateAccount } from "@/app/actions/auth"
import { FirstAccessForm } from "@/components/auth/first-access-form"

jest.mock("@/app/actions/auth", () => ({ activateAccount: jest.fn() }))

const mockActivate = activateAccount as jest.MockedFunction<
  typeof activateAccount
>

beforeEach(() => {
  mockActivate.mockReset()
  mockActivate.mockResolvedValue({})
})

describe("FirstAccessForm rendering", () => {
  it("renders the password fields and the submit button", () => {
    render(<FirstAccessForm token="plain-token" />)

    expect(screen.getByLabelText("Defina uma senha")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ativar conta" })
    ).toBeInTheDocument()
  })

  it("carries the token as a hidden field", () => {
    const { container } = render(<FirstAccessForm token="plain-token" />)

    expect(container.querySelector('input[name="token"]')).toHaveValue(
      "plain-token"
    )
  })
})

describe("FirstAccessForm submission", () => {
  it("sends the token and the chosen password to the server action", async () => {
    const user = userEvent.setup()
    render(<FirstAccessForm token="plain-token" />)

    await user.type(screen.getByLabelText("Defina uma senha"), "secret123")
    await user.type(screen.getByLabelText("Confirmar senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Ativar conta" }))

    expect(mockActivate).toHaveBeenCalledTimes(1)
    const formData = mockActivate.mock.calls[0][1]
    expect(formData.get("token")).toBe("plain-token")
    expect(formData.get("password")).toBe("secret123")
    expect(formData.get("confirmPassword")).toBe("secret123")
  })

  it("shows a mismatch error on the confirmation field", async () => {
    mockActivate.mockResolvedValue({
      errors: { confirmPassword: ["As senhas não coincidem."] },
    })
    const user = userEvent.setup()
    render(<FirstAccessForm token="plain-token" />)

    await user.type(screen.getByLabelText("Defina uma senha"), "secret123")
    await user.type(screen.getByLabelText("Confirmar senha"), "different")
    await user.click(screen.getByRole("button", { name: "Ativar conta" }))

    expect(
      await screen.findByText("As senhas não coincidem.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Confirmar senha")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  it("announces an invalid or expired token as an alert", async () => {
    mockActivate.mockResolvedValue({
      message: "Token de primeiro acesso inválido ou expirado.",
    })
    const user = userEvent.setup()
    render(<FirstAccessForm token="stale-token" />)

    await user.type(screen.getByLabelText("Defina uma senha"), "secret123")
    await user.type(screen.getByLabelText("Confirmar senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Ativar conta" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(
      "Token de primeiro acesso inválido ou expirado."
    )
  })
})
