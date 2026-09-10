import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Recuperar senha | Solara",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu e-mail para receber as instruções de recuperação da
            conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
