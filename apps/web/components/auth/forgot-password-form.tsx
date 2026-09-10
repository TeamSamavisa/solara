"use client"

import Link from "next/link"
import { useActionState } from "react"

import { requestPasswordReset } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { ForgotPasswordFormState } from "@/lib/auth/definitions"

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordFormState | undefined,
    FormData
  >(requestPasswordReset, undefined)

  return (
    <form action={formAction} className="space-y-6">
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
          <FieldError
            errors={state?.errors?.email?.map((message) => ({ message }))}
          />
        </Field>
      </FieldGroup>

      {state?.message ? (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success
              ? "rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
              : "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Spinner /> Enviando...
          </>
        ) : (
          "Enviar instruções"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}
