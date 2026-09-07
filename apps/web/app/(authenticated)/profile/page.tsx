import type { Metadata } from "next"

import { ProfileForm } from "@/components/profile/profile-form"
import { PageHeader } from "@/components/shared/list-chrome"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth/dal"
import type { Role } from "@/lib/auth/roles"

export const metadata: Metadata = { title: "Perfil" }

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  principal: "Diretor",
  coordinator: "Coordenador",
  teacher: "Professor",
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <p className="text-muted-foreground">
        Não foi possível carregar seu perfil.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Gerencie seus dados de acesso" />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {user.full_name}
            <Badge variant="secondary">
              {ROLE_LABELS[user.role as Role] ?? user.role}
            </Badge>
          </CardTitle>
          <CardDescription>
            O cargo só pode ser alterado por um administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
