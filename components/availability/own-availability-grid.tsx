"use client"

import { setOwnAvailabilityAction } from "@/app/(authenticated)/availability/actions"
import {
  AvailabilityGrid,
  type AvailabilitySlot,
} from "@/components/availability/availability-grid"

/** Binds the grid to the action that only ever touches the caller's own rows. */
export function OwnAvailabilityGrid({
  slots,
  selectedScheduleIds,
}: {
  slots: AvailabilitySlot[]
  selectedScheduleIds: number[]
}) {
  return (
    <AvailabilityGrid
      slots={slots}
      selectedScheduleIds={selectedScheduleIds}
      onToggle={setOwnAvailabilityAction}
    />
  )
}
