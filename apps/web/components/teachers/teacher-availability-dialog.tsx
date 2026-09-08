"use client"

import { useState } from "react"

import {
  DialogTriggerButton,
  type DialogTriggerSpec,
} from "@/components/shared/dialog-trigger"
import { setTeacherAvailabilityAction } from "@/app/(authenticated)/availability/actions"
import {
  AvailabilityGrid,
  type AvailabilitySlot,
} from "@/components/availability/availability-grid"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { FormState } from "@/lib/forms"

/** Lets an admin edit the availability of a given teacher. */
export function TeacherAvailabilityDialog({
  teacherId,
  teacherName,
  slots,
  selectedScheduleIds,
  trigger,
}: {
  teacherId: number
  teacherName: string
  slots: AvailabilitySlot[]
  selectedScheduleIds: number[]
  trigger: DialogTriggerSpec
}) {
  const [open, setOpen] = useState(false)

  const toggle = (scheduleId: number, available: boolean): Promise<FormState> =>
    setTeacherAvailabilityAction(teacherId, scheduleId, available)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DialogTriggerButton {...trigger} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Disponibilidade de {teacherName}</DialogTitle>
          <DialogDescription>
            Clique nos horários em que este professor está disponível.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <AvailabilityGrid
            slots={slots}
            selectedScheduleIds={selectedScheduleIds}
            onToggle={toggle}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
