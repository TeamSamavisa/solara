import type { Metadata } from "next"

import { StatusPage } from "@/components/layout/status-page"

export const metadata: Metadata = { title: "Página não encontrada | Solara" }

export default function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi movido."
    />
  )
}
