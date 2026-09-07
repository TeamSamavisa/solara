"use client"

import { RotateCcwIcon } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** Error boundary for the authenticated area. Must be a Client Component. */
export default function AuthenticatedError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Algo deu errado</CardTitle>
        <CardDescription>
          Não foi possível carregar esta página. Tente novamente; se o problema
          persistir, avise um administrador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error.digest ? (
          <p className="text-muted-foreground font-mono text-xs">
            Referência: {error.digest}
          </p>
        ) : null}
        <Button type="button" onClick={() => unstable_retry()}>
          <RotateCcwIcon /> Tentar novamente
        </Button>
      </CardContent>
    </Card>
  )
}
