import type { Metadata } from "next"

import { OwnAvailabilityGrid } from "@/components/availability/own-availability-grid"
import { PageHeader } from "@/components/shared/list-chrome"
import { Card, CardContent } from "@/components/ui/card"
import { verifySession } from "@/lib/auth/dal"
import { listSchedules } from "@/lib/db/actions/schedules"
import { listTeacherAvailability } from "@/lib/db/actions/schedule-teachers"

export const metadata: Metadata = { title: "Minha Disponibilidade" }

export default async function AvailabilityPage() {
  // Open to every authenticated user: it only ever edits their own rows.
  const session = await verifySession()

  const [schedules, selectedScheduleIds] = await Promise.all([
    listSchedules({ limit: 100 }),
    listTeacherAvailability(session.userId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Disponibilidade"
        description="Informe sua disponibilidade de horários para alocação de aulas"
      />

      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">
              Selecione seus horários disponíveis
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Clique nos horários em que você está disponível para dar aulas.
            </p>
          </div>

          <OwnAvailabilityGrid
            slots={schedules.content}
            selectedScheduleIds={selectedScheduleIds}
          />
        </CardContent>
      </Card>
    </div>
  )
}
