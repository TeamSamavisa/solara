import type { Metadata } from "next"
import Link from "next/link"

import { FirstAccessForm } from "@/components/auth/first-access-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Primeiro acesso | Solara",
}

export default async function FirstAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Primeiro acesso</CardTitle>
          <CardDescription>
            Defina uma senha para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <FirstAccessForm token={token} />
          ) : (
            <div className="space-y-4">
              <p
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                Token de primeiro acesso inválido ou expirado.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="underline-offset-4 hover:underline"
                >
                  Voltar para o login
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
