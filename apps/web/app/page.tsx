import { redirect } from "next/navigation"

/** The proxy normally handles `/`; this keeps the route safe on its own. */
export default function RootPage() {
  redirect("/dashboard")
}
