import Image from "next/image"
import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { safeRedirectPath } from "@/lib/auth/definitions"

export const metadata: Metadata = {
  title: "Entrar | Solara",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams

  return (
    <div className="grid min-h-svh lg:grid-cols-5">
      <div className="relative hidden lg:col-span-3 lg:block">
        <Image
          src="/classroom.jpg"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
        <div className="from-primary/90 to-primary absolute inset-0 bg-gradient-to-br opacity-90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 lg:flex-row">
          <Image
            src="/solara.png"
            alt=""
            width={192}
            height={192}
            className="size-48 rounded-full object-cover"
          />
          <span className="text-primary-foreground text-6xl font-bold">
            Solara
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:col-span-2">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-center gap-4 lg:hidden">
            <Image
              src="/solara.png"
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
            <span className="text-3xl font-bold">Solara</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta para gerenciar a grade horária.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm redirectTo={safeRedirectPath(redirectTo)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
