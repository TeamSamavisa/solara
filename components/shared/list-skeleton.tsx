import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder that mirrors the header + filters + table of the list screens. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-72" />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex gap-2">
              <Skeleton className="h-14 w-56" />
              <Skeleton className="h-14 w-40" />
            </div>
            <Skeleton className="h-8 w-40" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            {Array.from({ length: rows }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
