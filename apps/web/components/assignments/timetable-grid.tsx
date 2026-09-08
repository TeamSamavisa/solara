import { TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Timetable } from "@/lib/timetable"
import { WEEKDAYS } from "@/lib/weekdays"

/** Printable weekday × time grid, ported from the legacy print tab. */
export function TimetableGrid({ timetable }: { timetable: Timetable }) {
  if (timetable.slots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma alocação com horário definido para esta turma.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th
              scope="col"
              className="w-20 border bg-muted p-1 text-center font-bold"
            >
              Horário
            </th>
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday.value}
                scope="col"
                className="border bg-muted p-1 text-center font-bold"
              >
                {weekday.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timetable.slots.map((slot) => (
            <tr key={slot}>
              <th
                scope="row"
                className="w-20 border bg-muted/50 p-1 text-center font-semibold whitespace-nowrap"
              >
                {slot}
              </th>
              {WEEKDAYS.map((weekday) => (
                <td key={weekday.value} className="border p-0.5 align-top">
                  {timetable.grid[weekday.value]?.[slot]?.map((cell, index) => (
                    <div
                      key={index}
                      className={cn(
                        "mb-0.5 rounded-none p-1 last:mb-0",
                        cell.violatesAvailability
                          ? "border border-destructive/50 bg-destructive/10"
                          : "bg-muted/40"
                      )}
                    >
                      <div className="font-semibold">{cell.subject}</div>
                      <div className="text-muted-foreground">
                        {cell.teacher}
                      </div>
                      <div className="text-muted-foreground">{cell.space}</div>
                      {cell.violatesAvailability ? (
                        <div className="mt-0.5 flex items-center gap-1 font-medium text-destructive">
                          <TriangleAlertIcon className="size-3" />
                          Viola disponibilidade
                        </div>
                      ) : null}
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
