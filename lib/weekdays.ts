/** Weekday values stored in the database, with their Portuguese labels. */
export const WEEKDAYS = [
  { value: "Monday", label: "Segunda" },
  { value: "Tuesday", label: "Terça" },
  { value: "Wednesday", label: "Quarta" },
  { value: "Thursday", label: "Quinta" },
  { value: "Friday", label: "Sexta" },
  { value: "Saturday", label: "Sábado" },
] as const

export type WeekdayValue = (typeof WEEKDAYS)[number]["value"]

const LABELS = new Map<string, string>(
  WEEKDAYS.map((weekday) => [weekday.value, weekday.label]),
)

/** Falls back to the stored value so unknown data is still readable. */
export function weekdayLabel(value: string): string {
  return LABELS.get(value) ?? value
}
