"use client"

import { useActionState } from "react"
import { toast } from "sonner"

import {
  updateProfileAction,
  type ProfileFormState,
} from "@/app/(authenticated)/profile/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { PublicUser } from "@solara/db/schemas"

function asFieldErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function ProfileForm({ user }: { user: PublicUser }) {
  const [state, formAction, pending] = useActionState<
    ProfileFormState | undefined,
    FormData
  >(async (previous, formData) => {
    const result = await updateProfileAction(previous, formData)

    if (result?.success && result.message) toast.success(result.message)

    return result
  }, undefined)

  return (
    <form action={formAction} className="space-y-6">
      <FieldGroup>
        <Field data-invalid={Boolean(state?.errors?.full_name) || undefined}>
          <FieldLabel htmlFor="full_name">Nome completo</FieldLabel>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={user.full_name}
            aria-invalid={Boolean(state?.errors?.full_name)}
            disabled={pending}
            required
          />
          <FieldError errors={asFieldErrors(state?.errors?.full_name)} />
        </Field>

        <Field data-invalid={Boolean(state?.errors?.email) || undefined}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={user.email}
            aria-invalid={Boolean(state?.errors?.email)}
            disabled={pending}
            required
          />
          <FieldError errors={asFieldErrors(state?.errors?.email)} />
        </Field>

        <Field data-invalid={Boolean(state?.errors?.registration) || undefined}>
          <FieldLabel htmlFor="registration">Matrícula</FieldLabel>
          <Input
            id="registration"
            name="registration"
            inputMode="numeric"
            defaultValue={user.registration ?? ""}
            aria-invalid={Boolean(state?.errors?.registration)}
            disabled={pending}
          />
          <FieldError errors={asFieldErrors(state?.errors?.registration)} />
        </Field>

        <Field data-invalid={Boolean(state?.errors?.password) || undefined}>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state?.errors?.password)}
            disabled={pending}
          />
          <FieldDescription>
            Deixe em branco para manter a senha atual.
          </FieldDescription>
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
            aria-invalid={Boolean(state?.errors?.confirmPassword)}
            disabled={pending}
          />
          <FieldError errors={asFieldErrors(state?.errors?.confirmPassword)} />
        </Field>
      </FieldGroup>

      {state?.message && !state.success ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : null}
        Salvar alterações
      </Button>
    </form>
  )
}
