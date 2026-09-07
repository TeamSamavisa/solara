/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { login } from "@/app/actions/auth"
import { LoginForm } from "@/components/auth/login-form"

jest.mock("@/app/actions/auth", () => ({ login: jest.fn() }))

const mockLogin = login as jest.MockedFunction<typeof login>

beforeEach(() => {
  mockLogin.mockReset()
  mockLogin.mockResolvedValue(undefined)
})

describe("LoginForm rendering", () => {
  it("renders the credential fields", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    expect(screen.getByLabelText("Senha")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument()
  })

  it("hides the password by default and reveals it on demand", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }))
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Ocultar senha" }))
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password")
  })

  it("carries the redirect target as a hidden field", () => {
    const { container } = render(<LoginForm redirectTo="/teachers" />)

    const hidden = container.querySelector('input[name="redirectTo"]')
    expect(hidden).toHaveValue("/teachers")
  })

  it("omits the hidden field when there is no redirect target", () => {
    const { container } = render(<LoginForm />)

    expect(container.querySelector('input[name="redirectTo"]')).toBeNull()
  })
})

describe("LoginForm submission", () => {
  it("sends the typed credentials to the server action", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Entrar" }))

    expect(mockLogin).toHaveBeenCalledTimes(1)
    const formData = mockLogin.mock.calls[0][1]
    expect(formData.get("email")).toBe("ana@example.com")
    expect(formData.get("password")).toBe("secret123")
  })

  it("shows the server-side field errors when the browser check is looser", async () => {
    // `ana@example` satisfies the HTML5 `type="email"` constraint (so the form
    // actually submits) but fails zod, which requires a TLD.
    mockLogin.mockResolvedValue({
      errors: { email: ["Informe um e-mail válido."] },
      email: "ana@example",
    })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example")
    await user.type(screen.getByLabelText("Senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Entrar" }))

    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText("Informe um e-mail válido."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
  })

  it("does not reach the server when the browser rejects the value", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("E-mail"), "not-an-email")
    await user.type(screen.getByLabelText("Senha"), "secret123")
    await user.click(screen.getByRole("button", { name: "Entrar" }))

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it("announces a credential failure as an alert", async () => {
    mockLogin.mockResolvedValue({ message: "E-mail ou senha inválidos." })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.type(screen.getByLabelText("Senha"), "wrong")
    await user.click(screen.getByRole("button", { name: "Entrar" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("E-mail ou senha inválidos.")
  })
})
