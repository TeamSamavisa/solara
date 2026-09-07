import { ListSkeleton } from "@/components/shared/list-skeleton"

/**
 * Shown while a route segment streams in. Every authenticated screen is a
 * list, so one placeholder covers them all.
 */
export default function Loading() {
  return <ListSkeleton />
}
