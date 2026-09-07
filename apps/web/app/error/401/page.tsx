import type { Metadata } from "next"

import { StatusPage } from "@/components/layout/status-page"

export const metadata: Metadata = { title: "Não autenticado | Solara" }

export default function UnauthorizedPage() {
  return (
    <StatusPage
      code="401"
      title="Sessão expirada"
      description="Sua sessão terminou ou você ainda não entrou. Faça login novamente para continuar."
      action={{ href: "/login", label: "Ir para o login" }}
    />
  )
}
