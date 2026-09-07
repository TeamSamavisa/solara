import type { Metadata } from "next"

import { StatusPage } from "@/components/layout/status-page"

export const metadata: Metadata = { title: "Acesso negado | Solara" }

export default function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="Acesso negado"
      description="Seu cargo não permite acessar esta área. Fale com um administrador se acredita que isso é um engano."
    />
  )
}
