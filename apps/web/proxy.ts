import { NextResponse, type NextRequest } from "next/server"

import { resolveRedirect } from "@/lib/auth/proxy-rules"
import { decrypt, SESSION_COOKIE } from "@/lib/auth/session"

/**
 * Optimistic auth check. It only reads the session cookie — never the database
 * — because the proxy runs on every request, including prefetches. The real
 * authorization happens in the Data Access Layer (`lib/auth/dal.ts`).
 */
export default async function proxy(request: NextRequest) {
  const session = await decrypt(
    request.cookies.get(SESSION_COOKIE)?.value,
  )

  const target = resolveRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSession: session !== null,
  })

  if (target) {
    return NextResponse.redirect(new URL(target, request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
