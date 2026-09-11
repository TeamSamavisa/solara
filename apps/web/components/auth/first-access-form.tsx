"use client"

import { useActionState } from "react"

import { activateAccount } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { FirstAccessFormState } from "@/lib/auth/definitions"

function asFieldErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function FirstAccessForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<
    FirstAccessFormState | undefined,
    FormData
  >(activateAccount, undefined)

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      <FieldGroup>
        <Field data-invalid={Boolean(state?.errors?.password) || undefined}>
          <FieldLabel htmlFor="password">Defina uma senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Digite a senha"
            aria-invalid={Boolean(state?.errors?.password)}
            disabled={pending}
            required
          />
          <FieldError errors={asFieldErrors(state?.errors?.password)} />
        </Field>

        <Field
          data-invalid={Boolean(state?.errors?.confirmPassword) || undefined}
        >
          <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={Boolean(state?.errors?.confirmPassword)}
            disabled={pending}
            required
          />
          <FieldError errors={asFieldErrors(state?.errors?.confirmPassword)} />
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
            <Spinner /> Ativando...
          </>
        ) : (
          "Ativar conta"
        )}
      </Button>
    </form>
  )
}
