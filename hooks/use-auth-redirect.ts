"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"

import { buildCallbackURL, createSignInPath } from "@/lib/auth-redirect"

type UseAuthRedirectParams = Readonly<{
  session: unknown
  isSessionPending: boolean
}>

type UseAuthRedirectResult = {
  isRedirecting: boolean
}

export function useAuthRedirect({
  session,
  isSessionPending,
}: UseAuthRedirectParams): UseAuthRedirectResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const callbackURL = useMemo(() => {
    return buildCallbackURL(pathname, searchParams.toString())
  }, [pathname, searchParams])

  const isAuthenticated = Boolean(session)
  const isRedirecting = !isSessionPending && !isAuthenticated

  useEffect(() => {
    if (!isRedirecting) {
      return
    }

    router.replace(createSignInPath(callbackURL))
  }, [callbackURL, isRedirecting, router])

  return {
    isRedirecting,
  }
}
