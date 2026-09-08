"use client"

import { useActionState, useState } from "react"
import { toast } from "sonner"

import {
  DialogTriggerButton,
  type DialogTriggerSpec,
} from "@/components/shared/dialog-trigger"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Spinner } from "@/components/ui/spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import type { FormState } from "@/lib/forms"

export type EntityAction = (
  state: FormState | undefined,
  formData: FormData
) => Promise<FormState | undefined>

export interface EntityFieldsProps {
  state?: FormState
  pending: boolean
  /** Errors for a field, already shaped for `FieldError`. */
  errorsFor: (name: string) => { message: string }[] | undefined
  isInvalid: (name: string) => boolean
}

/**
 * Create/edit shell shared by every CRUD screen: a dialog on desktop, a drawer
 * on small screens, with the fields supplied by the caller.
 */
export function EntityDialog({
  trigger,
  title,
  description,
  submitLabel,
  action,
  hiddenFields,
  withIdempotencyKey = false,
  renderFields,
}: {
  trigger: DialogTriggerSpec
  title: string
  description: string
  submitLabel: string
  action: EntityAction
  hiddenFields?: Record<string, string | number>
  withIdempotencyKey?: boolean
  renderFields: (props: EntityFieldsProps) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  // A fresh key per dialog session makes a replayed submit a server-side no-op.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    globalThis.crypto.randomUUID()
  )

  const [state, formAction, pending] = useActionState<
    FormState | undefined,
    FormData
  >(async (previous, formData) => {
    const result = await action(previous, formData)

    // Side effects live here rather than in an effect watching the state.
    if (result?.success) {
      if (result.message) toast.success(result.message)
      setOpen(false)
      setIdempotencyKey(globalThis.crypto.randomUUID())
    }

    return result
  }, undefined)

  const fieldProps: EntityFieldsProps = {
    state,
    pending,
    errorsFor: (name) => state?.errors?.[name]?.map((message) => ({ message })),
    isInvalid: (name) => Boolean(state?.errors?.[name]),
  }

  const body = (
    <>
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {withIdempotencyKey ? (
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      ) : null}

      <div className="grid gap-4">{renderFields(fieldProps)}</div>

      {state?.message && !state.success ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </>
  )

  const submit = (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner /> : null}
      {submitLabel}
    </Button>
  )

  const cancel = (
    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
      Cancelar
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <DialogTriggerButton {...trigger} />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <form action={formAction}>
            <div className="px-4">{body}</div>
            <DrawerFooter>
              {submit}
              {cancel}
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DialogTriggerButton {...trigger} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          {body}
          <DialogFooter className="mt-6">
            {cancel}
            {submit}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
