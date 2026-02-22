import { ConvexError } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { authComponent } from '../betterAuth/auth'

type AppCtx = QueryCtx | MutationCtx

export function getAuthOwnerKey(user: { _id: string; userId?: string | null }) {
  if (user.userId && user.userId.trim().length > 0) {
    return user.userId
  }
  return String(user._id)
}

export async function requireAuthUser(ctx: AppCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new ConvexError('Unauthenticated')
  }
  return user
}

export async function requireLedgerOwner(ctx: AppCtx, ledgerId: Id<'ledgers'>) {
  const user = await requireAuthUser(ctx)
  const ownerKey = getAuthOwnerKey(user)
  const ledger = await ctx.db.get(ledgerId)
  if (!ledger) {
    throw new ConvexError('Ledger not found')
  }
  if (ledger.userId !== ownerKey) {
    throw new ConvexError('Forbidden')
  }
  return { ledger, user }
}
