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
      <p className="text-muted-foreground text-7xl font-bold">{code}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-prose">{description}</p>
      <Button asChild className="mt-2">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </main>
  )
}
