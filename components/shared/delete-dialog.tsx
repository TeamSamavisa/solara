"use client"

import { useActionState, useState } from "react"
import { toast } from "sonner"

import type { EntityAction } from "@/components/shared/entity-dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/** Confirmation shared by every CRUD screen. */
export function DeleteDialog({
  trigger,
  id,
  action,
  entityLabel,
  name,
}: {
  trigger: React.ReactNode
  id: number
  action: EntityAction
  /** e.g. "o turno", used in the sentence. */
  entityLabel: string
  name: string
}) {
  const [open, setOpen] = useState(false)

  const [, formAction, pending] = useActionState<
    Awaited<ReturnType<EntityAction>>,
    FormData
  >(async (previous, formData) => {
    const result = await action(previous, formData)

    if (result?.success) {
      if (result.message) toast.success(result.message)
      setOpen(false)
    } else if (result?.message) {
      toast.error(result.message)
    }

    return result
  }, undefined)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {entityLabel}{" "}
            <span className="font-semibold">{name}</span>? Esta ação não pode
            ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Spinner /> : null}
              Excluir
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
