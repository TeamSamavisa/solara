import Link from "next/link"
import type { Metadata } from "next"

import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser, verifySession } from "@/lib/auth/dal"
import type { Role } from "@/lib/auth/roles"
import { greetingFor } from "@/lib/greeting"
import { visibleNavGroups } from "@/lib/navigation"

export const metadata: Metadata = { title: "Início" }

const ROLE_LABELS: Record<Role, string> = {
  admin: "Painel do Administrador",
  principal: "Painel do Diretor",
  coordinator: "Painel do Coordenador",
  teacher: "Painel do Professor",
}

export default async function DashboardPage() {
  const session = await verifySession()
  const user = await getCurrentUser()

  const greeting = greetingFor(new Date().getHours())
  const shortcuts = visibleNavGroups(session.role).flatMap(
    (group) => group.items,
  )

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold">
          {greeting}
          {user?.full_name ? `, ${user.full_name}` : ""}!
        </h1>
        <p className="text-muted-foreground text-lg">
          {ROLE_LABELS[session.role]}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Atalhos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => (
            <Card
              key={item.href}
              className="hover:border-ring transition-colors"
            >
              <CardContent>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 font-medium"
                >
                  <item.icon className="text-muted-foreground size-5 shrink-0" />
                  {item.label}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
