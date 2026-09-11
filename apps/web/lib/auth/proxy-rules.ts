import { DEFAULT_REDIRECT } from "./definitions"

/** Routes that only make sense while signed out. */
export const AUTH_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/first-access",
] as const

/**
 * Routes that must render for everyone. The 403 page in particular has to stay
 * reachable while signed in, otherwise the authorization redirect would loop.
 */
export const NEUTRAL_ROUTE_PREFIXES = ["/error"] as const

export const LOGIN_ROUTE = "/login"

export function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname)
}

export function isNeutralRoute(pathname: string): boolean {
  return NEUTRAL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export interface ProxyRouteInput {
  pathname: string
  search?: string
  hasSession: boolean
}

/**
 * Optimistic routing decision based only on the presence of a session cookie.
 * Authorization by role stays in the Data Access Layer, close to the data.
 *
 * Returns the path to redirect to, or `null` to let the request through.
 */
export function resolveRedirect({
  pathname,
  search = "",
  hasSession,
}: ProxyRouteInput): string | null {
  if (isNeutralRoute(pathname)) return null

  if (isAuthRoute(pathname)) {
    return hasSession ? DEFAULT_REDIRECT : null
  }

  if (pathname === "/") {
    return hasSession ? DEFAULT_REDIRECT : LOGIN_ROUTE
  }

  if (!hasSession) {
    const target = `${pathname}${search}`

    return `${LOGIN_ROUTE}?redirectTo=${encodeURIComponent(target)}`
  }

  return null
}
