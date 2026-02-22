'use client'

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'

import { authClient } from '@/lib/auth-client'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL')
}
const convex = new ConvexReactClient(convexUrl)

type ConvexClientProviderProps = Readonly<{
  children: ReactNode
  initialToken?: string | null
}>

export function ConvexClientProvider({ children, initialToken }: ConvexClientProviderProps) {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex} initialToken={initialToken}>
      {children}
    </ConvexBetterAuthProvider>
  )
}
