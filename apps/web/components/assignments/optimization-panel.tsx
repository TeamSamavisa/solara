"use client"

import { CheckCircle2Icon, SparklesIcon, TriangleAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { OptimizationStatus } from "@/app/actions/timetabling"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type { FormState } from "@/lib/forms"

/** How often a running task is checked. */
const POLL_INTERVAL = 2000

export function OptimizationPanel({
  canManage,
  initialStatus,
  startAction,
  statusAction,
}: {
  canManage: boolean
  initialStatus: OptimizationStatus
  startAction: (
    state: FormState | undefined,
    formData: FormData
  ) => Promise<FormState>
  statusAction: () => Promise<OptimizationStatus>
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [confirming, setConfirming] = useState(false)
  const running = status.task?.status === "PROCESSING"

  /** Re-running throws away the timetable that is already in place. */
  const replacing = status.statistics.scheduled > 0

  const [, formAction, submitting] = useActionState<
    FormState | undefined,
    FormData
  >(async (previous, formData) => {
    const result = await startAction(previous, formData)

    setConfirming(false)

    if (result?.success) {
      toast.success(result.message ?? "Otimização iniciada.")
      // Poll from the next tick instead of waiting for a full page refresh.
      setStatus((current) => ({
        ...current,
        task: {
          id: 0,
          status: "PROCESSING",
          progress: 0,
          errorMessage: null,
          finishedAt: new Date().toISOString(),
        },
      }))
    } else if (result?.message) {
      toast.error(result.message)
    }

    return result
  }, undefined)

  // `refresh` re-renders the server components, so the grid and the list pick
  // up the new allocations. Guarded so it happens once per finished run.
  const refreshed = useRef(false)

  useEffect(() => {
    if (!running) return

    refreshed.current = false
    let active = true

    const timer = setInterval(async () => {
      try {
        const next = await statusAction()

        if (!active) return

        setStatus(next)

        if (next.task?.status !== "PROCESSING" && !refreshed.current) {
          refreshed.current = true
          router.refresh()
        }
      } catch {
        // A dropped poll is not worth reporting; the next tick tries again.
      }
    }, POLL_INTERVAL)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [running, router, statusAction])

  const { statistics, task } = status

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Otimização da grade</CardTitle>
          <CardDescription>
            Gera automaticamente horários e salas para as alocações cadastradas,
            respeitando a disponibilidade dos professores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-3 gap-4 text-center">
            <Counter label="Alocações" value={statistics.total} />
            <Counter label="Com horário" value={statistics.scheduled} />
            <Counter label="Sem horário" value={statistics.pending} />
          </dl>

          {canManage ? (
            <AlertDialog open={confirming} onOpenChange={setConfirming}>
              <AlertDialogTrigger asChild>
                <Button disabled={running || submitting}>
                  {running || submitting ? <Spinner /> : <SparklesIcon />}
                  Otimizar grade
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {replacing ? "Refazer a otimização?" : "Otimizar a grade?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {replacing ? (
                      <>
                        Os horários e as salas de{" "}
                        <span className="font-semibold">
                          {statistics.scheduled}
                        </span>{" "}
                        {statistics.scheduled === 1
                          ? "alocação serão substituídos"
                          : "alocações serão substituídos"}{" "}
                        pelo resultado da nova otimização, inclusive os ajustes
                        feitos à mão. Esta ação não pode ser desfeita.
                      </>
                    ) : (
                      <>
                        A grade será gerada para as{" "}
                        <span className="font-semibold">
                          {statistics.total}
                        </span>{" "}
                        alocações cadastradas. O processamento roda em segundo
                        plano e pode levar alguns minutos.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <form action={formAction}>
                    <Button
                      type="submit"
                      variant={replacing ? "destructive" : "default"}
                    >
                      Otimizar
                    </Button>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </CardContent>
      </Card>

      {task === null ? (
        <Alert>
          <SparklesIcon />
          <AlertTitle>Nenhuma otimização executada</AlertTitle>
          <AlertDescription>
            Inicie uma otimização para distribuir as alocações na grade.
          </AlertDescription>
        </Alert>
      ) : null}

      {task?.status === "PROCESSING" ? (
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Otimização em andamento…
              </span>
              <span className="font-medium tabular-nums">{task.progress}%</span>
            </div>
            <Progress value={task.progress} />
          </CardContent>
        </Card>
      ) : null}

      {task?.status === "COMPLETED" ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Otimização concluída</AlertTitle>
          <AlertDescription>
            A grade foi atualizada com os horários e as salas encontrados.
          </AlertDescription>
        </Alert>
      ) : null}

      {task?.status === "FAILED" ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>A otimização falhou</AlertTitle>
          <AlertDescription>
            {task.errorMessage ?? "Tente novamente em alguns instantes."}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
