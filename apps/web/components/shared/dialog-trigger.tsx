"use client"

import {
  CalendarClockIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const ICONS = {
  add: PlusIcon,
  edit: PencilIcon,
  delete: Trash2Icon,
  availability: CalendarClockIcon,
} as const

/**
 * Describes a dialog trigger with plain, serializable data.
 *
 * The button deliberately cannot be built in a server component and handed
 * over as JSX: Radix's `asChild` needs a resolved React element, and an
 * element that crosses the RSC boundary arrives as a lazy reference once the
 * payload is split across chunks — which makes server rendering throw
 * "Primitive.button failed to slot onto its children".
 */
export interface DialogTriggerSpec {
  icon: keyof typeof ICONS
  /** Visible text; without it the button is icon-only. */
  label?: string
  /** Accessible name, required when there is no visible label. */
  ariaLabel?: string
}

export function DialogTriggerButton({
  icon,
  label,
  ariaLabel,
  variant,
  size,
  ...props
}: DialogTriggerSpec & React.ComponentProps<typeof Button>) {
  const Icon = ICONS[icon]

  return (
    <Button
      type="button"
      variant={variant ?? (label ? "default" : "ghost")}
      size={size ?? (label ? "default" : "icon")}
      aria-label={ariaLabel}
      {...props}
    >
      <Icon />
      {label}
    </Button>
  )
}
