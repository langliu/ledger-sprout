import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { buildCallbackURL, createSignInPath } from '@/lib/auth-redirect'

function hasSessionTokenCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.toLowerCase().includes('session_token'))
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/sign-in' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (hasSessionTokenCookie(request)) {
    return NextResponse.next()
  }

  const callbackURL = buildCallbackURL(pathname, search)
  const signInURL = new URL(createSignInPath(callbackURL), request.url)
  return NextResponse.redirect(signInURL)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/accounts/:path*',
    '/categories/:path*',
    '/reports/:path*',
  ],
}
