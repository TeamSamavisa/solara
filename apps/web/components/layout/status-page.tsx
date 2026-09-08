import Link from "next/link"

import { Button } from "@/components/ui/button"

export function StatusPage({
  code,
  title,
  description,
  action = { href: "/dashboard", label: "Voltar ao início" },
}: {
  code: string
  title: string
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-7xl font-bold text-muted-foreground">{code}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-prose text-muted-foreground">{description}</p>
      <Button asChild className="mt-2">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </main>
  )
}
