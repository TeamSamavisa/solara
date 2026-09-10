/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { requestPasswordReset } from "@/app/actions/auth"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

jest.mock("@/app/actions/auth", () => ({ requestPasswordReset: jest.fn() }))

const mockRequest = requestPasswordReset as jest.MockedFunction<
  typeof requestPasswordReset
>

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe("ForgotPasswordForm rendering", () => {
  it("renders the email field and the submit button", () => {
    render(<ForgotPasswordForm />)

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Enviar instruções" })
    ).toBeInTheDocument()
  })

  it("links back to the login page", () => {
    render(<ForgotPasswordForm />)

    expect(
      screen.getByRole("link", { name: "Voltar para o login" })
    ).toHaveAttribute("href", "/login")
  })
})

describe("ForgotPasswordForm submission", () => {
  it("sends the typed email to the server action", async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    expect(mockRequest).toHaveBeenCalledTimes(1)
    const formData = mockRequest.mock.calls[0][1]
    expect(formData.get("email")).toBe("ana@example.com")
  })

  it("does not reach the server when the browser rejects the value", async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText("E-mail"), "not-an-email")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    expect(mockRequest).not.toHaveBeenCalled()
  })

  it("shows the server-side field errors when the browser check is looser", async () => {
    mockRequest.mockResolvedValue({
      errors: { email: ["Informe um e-mail válido."] },
      email: "ana@example",
    })
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    expect(
      await screen.findByText("Informe um e-mail válido.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  it("announces the acknowledgement as a status, never as an error", async () => {
    mockRequest.mockResolvedValue({
      success: true,
      message:
        "Se o e-mail informado estiver cadastrado, você receberá as instruções para recuperar a conta.",
    })
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    const status = await screen.findByRole("status")
    expect(status).toHaveTextContent("Se o e-mail informado estiver cadastrado")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("announces a delivery failure as an alert", async () => {
    mockRequest.mockResolvedValue({
      message:
        "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.",
    })
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Não foi possível enviar o e-mail")
  })
})
