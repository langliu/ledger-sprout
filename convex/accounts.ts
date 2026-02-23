import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthOwnerKey, requireLedgerOwner } from './lib/auth'
import { assertIntegerAmount, normalizeRequiredName } from './lib/validation'

const accountTypeValidator = v.union(
  v.literal('cash'),
  v.literal('bank'),
  v.literal('credit'),
  v.literal('wallet'),
)

const accountStatusValidator = v.union(v.literal('active'), v.literal('inactive'))

export const listAdjustments = query({
  args: {
    accountId: v.optional(v.id('accounts')),
    ledgerId: v.id('ledgers'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)
    const limit = args.limit ?? 20
    if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
      throw new ConvexError('limit must be an integer between 1 and 200')
    }

    if (args.accountId) {
      const accountId = args.accountId
      const account = await ctx.db.get(accountId)
      if (!account) {
        throw new ConvexError('Account not found')
      }
      if (account.ledgerId !== args.ledgerId) {
        throw new ConvexError('Account does not belong to ledger')
      }

      return await ctx.db
        .query('balanceAdjustments')
        .withIndex('by_account_createdAt', (q) => q.eq('accountId', accountId))
        .order('desc')
        .take(limit)
    }

    return await ctx.db
      .query('balanceAdjustments')
      .withIndex('by_ledger_createdAt', (q) => q.eq('ledgerId', args.ledgerId))
      .order('desc')
      .take(limit)
  },
})

export const list = query({
  args: {
    ledgerId: v.id('ledgers'),
    status: v.optional(accountStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)

    if (args.status) {
      const status = args.status
      return await ctx.db
        .query('accounts')
        .withIndex('by_ledger_status', (q) => q.eq('ledgerId', args.ledgerId).eq('status', status))
        .collect()
    }

    return await ctx.db
      .query('accounts')
      .withIndex('by_ledger', (q) => q.eq('ledgerId', args.ledgerId))
      .collect()
  },
})

export const create = mutation({
  args: {
    initialBalance: v.number(),
    ledgerId: v.id('ledgers'),
    name: v.string(),
    type: accountTypeValidator,
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)

    const name = normalizeRequiredName(args.name, 'name')
    assertIntegerAmount(args.initialBalance, 'initialBalance')

    const now = Date.now()
    const accountId = await ctx.db.insert('accounts', {
      createdAt: now,
      currentBalance: args.initialBalance,
      initialBalance: args.initialBalance,
      ledgerId: args.ledgerId,
      name,
      status: 'active',
      type: args.type,
      updatedAt: now,
    })

    return await ctx.db.get(accountId)
  },
})

export const update = mutation({
  args: {
    accountId: v.id('accounts'),
    name: v.optional(v.string()),
    status: v.optional(accountStatusValidator),
    type: v.optional(accountTypeValidator),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account) {
      throw new ConvexError('Account not found')
    }

    await requireLedgerOwner(ctx, account.ledgerId)

    const patch: {
      name?: string
      type?: 'cash' | 'bank' | 'credit' | 'wallet'
      status?: 'active' | 'inactive'
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.name !== undefined) {
      patch.name = normalizeRequiredName(args.name, 'name')
    }
    if (args.type !== undefined) {
      patch.type = args.type
    }
    if (args.status !== undefined) {
      patch.status = args.status
    }

    await ctx.db.patch(args.accountId, patch)
    return await ctx.db.get(args.accountId)
  },
})

export const adjustBalance = mutation({
  args: {
    accountId: v.id('accounts'),
    delta: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account) {
      throw new ConvexError('Account not found')
    }

    const { user } = await requireLedgerOwner(ctx, account.ledgerId)
    assertIntegerAmount(args.delta, 'delta')

    const reason = args.reason?.trim()
    if (args.reason !== undefined) {
      if (!reason || reason.length === 0) {
        throw new ConvexError('reason cannot be empty')
      }
    }

    const updatedAt = Date.now()
    await ctx.db.patch(args.accountId, {
      currentBalance: account.currentBalance + args.delta,
      updatedAt,
    })
    await ctx.db.insert('balanceAdjustments', {
      accountId: args.accountId,
      delta: args.delta,
      ledgerId: account.ledgerId,
      ...(reason ? { reason } : {}),
      actorUserId: getAuthOwnerKey(user),
      createdAt: updatedAt,
    })

    return await ctx.db.get(args.accountId)
  },
})
