import { TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Timetable } from "@/lib/timetable"
import { WEEKDAYS } from "@/lib/weekdays"

/** Printable weekday × time grid, ported from the legacy print tab. */
export function TimetableGrid({ timetable }: { timetable: Timetable }) {
  if (timetable.slots.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
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
              className="bg-muted w-20 border p-1 text-center font-bold"
            >
              Horário
            </th>
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday.value}
                scope="col"
                className="bg-muted border p-1 text-center font-bold"
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
                className="bg-muted/50 w-20 border p-1 text-center font-semibold whitespace-nowrap"
              >
                {slot}
              </th>
              {WEEKDAYS.map((weekday) => (
                <td
                  key={weekday.value}
                  className="border p-0.5 align-top"
                >
                  {timetable.grid[weekday.value]?.[slot]?.map((cell, index) => (
                    <div
                      key={index}
                      className={cn(
                        "mb-0.5 rounded-none p-1 last:mb-0",
                        cell.violatesAvailability
                          ? "border-destructive/50 bg-destructive/10 border"
                          : "bg-muted/40",
                      )}
                    >
                      <div className="font-semibold">{cell.subject}</div>
                      <div className="text-muted-foreground">
                        {cell.teacher}
                      </div>
                      <div className="text-muted-foreground">{cell.space}</div>
                      {cell.violatesAvailability ? (
                        <div className="text-destructive mt-0.5 flex items-center gap-1 font-medium">
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
