import { cn } from "@/lib/utils"

/**
 * Table values are free text and some are very long, which pushes the table
 * out of the viewport. This clips them to a fixed width and keeps the full
 * value available as the element's title.
 */
export function Truncated({
  children,
  className,
}: {
  children: string | null | undefined
  className?: string
}) {
  const text = children?.trim()

  if (!text) return <span className="text-muted-foreground">—</span>

  return (
    <span className={cn("block max-w-56 truncate", className)} title={text}>
      {text}
    </span>
  )
}
