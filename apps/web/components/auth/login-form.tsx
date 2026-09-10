"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"

import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { LoginFormState } from "@/lib/auth/definitions"

function asFieldErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState<
    LoginFormState | undefined,
    FormData
  >(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction} className="space-y-6">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <FieldGroup>
        <Field data-invalid={Boolean(state?.errors?.email) || undefined}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            defaultValue={state?.email}
            aria-invalid={Boolean(state?.errors?.email)}
            disabled={pending}
            required
          />
          <FieldError errors={asFieldErrors(state?.errors?.email)} />
        </Field>

        <Field data-invalid={Boolean(state?.errors?.password) || undefined}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              aria-invalid={Boolean(state?.errors?.password)}
              disabled={pending}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          <FieldError errors={asFieldErrors(state?.errors?.password)} />
        </Field>
      </FieldGroup>

      {state?.message ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Spinner /> Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  )
}
