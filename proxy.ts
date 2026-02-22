import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createSignInPath } from "@/lib/auth-redirect"

function hasSessionTokenCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.toLowerCase().includes("session_token"))
}

export function proxy(request: NextRequest) {
  if (hasSessionTokenCookie(request)) {
    return NextResponse.next()
  }

  const callbackURL = `${request.nextUrl.pathname}${request.nextUrl.search}`
  const signInURL = new URL(createSignInPath(callbackURL), request.url)
  return NextResponse.redirect(signInURL)
}

export const proxyConfig = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/accounts/:path*",
    "/categories/:path*",
    "/reports/:path*",
  ],
}
