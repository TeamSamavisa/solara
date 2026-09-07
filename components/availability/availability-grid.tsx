"use client"

import { CheckIcon } from "lucide-react"
import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/forms"
import { WEEKDAYS } from "@/lib/weekdays"

export interface AvailabilitySlot {
  id: number
  weekday: string
  start_time: string
  end_time: string
}

export type ToggleAvailability = (
  scheduleId: number,
  available: boolean,
) => Promise<FormState>

export function AvailabilityGrid({
  slots,
  selectedScheduleIds,
  onToggle,
  readOnly = false,
}: {
  slots: AvailabilitySlot[]
  selectedScheduleIds: number[]
  onToggle: ToggleAvailability
  readOnly?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  // The grid gets many clicks, so the change shows immediately and is
  // reconciled when the server action resolves.
  const [selected, applyOptimistic] = useOptimistic(
    new Set(selectedScheduleIds),
    (current: Set<number>, scheduleId: number) => {
      const next = new Set(current)

      if (next.has(scheduleId)) next.delete(scheduleId)
      else next.add(scheduleId)

      return next
    },
  )

  function toggle(scheduleId: number) {
    const willBeAvailable = !selected.has(scheduleId)

    startTransition(async () => {
      applyOptimistic(scheduleId)

      const result = await onToggle(scheduleId, willBeAvailable)

      if (result?.message && !result.success) toast.error(result.message)
    })
  }

  const byWeekday = WEEKDAYS.map((weekday) => ({
    ...weekday,
    slots: slots
      .filter((slot) => slot.weekday === weekday.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((weekday) => weekday.slots.length > 0)

  if (byWeekday.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum horário cadastrado.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-semibold">{selected.size}</span>{" "}
        horário(s) selecionado(s)
      </p>

      {byWeekday.map((weekday) => (
        <section key={weekday.value} className="space-y-3">
          <h3 className="text-lg font-semibold">{weekday.label}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {weekday.slots.map((slot) => {
              const isSelected = selected.has(slot.id)

              return (
                <Button
                  key={slot.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  disabled={readOnly || isPending}
                  aria-pressed={isSelected}
                  aria-label={`${weekday.label} ${slot.start_time} às ${slot.end_time}`}
                  onClick={() => toggle(slot.id)}
                  className="relative h-auto flex-col gap-0 py-3"
                >
                  {isSelected ? (
                    <CheckIcon
                      aria-hidden
                      className="absolute top-1 right-1 size-3"
                    />
                  ) : null}
                  <span className="text-sm font-semibold">
                    {slot.start_time}
                  </span>
                  <span className="text-xs opacity-70">até</span>
                  <span className="text-sm font-semibold">{slot.end_time}</span>
                </Button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
