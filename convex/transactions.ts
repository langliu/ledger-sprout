import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { requireLedgerOwner } from './lib/auth'
import {
  assertPositiveIntegerAmount,
  assertTimestamp,
  normalizeOptionalNote,
} from './lib/validation'

type AppCtx = QueryCtx | MutationCtx

const transactionTypeValidator = v.union(
  v.literal('expense'),
  v.literal('income'),
  v.literal('transfer'),
)

function assertNonNegativeIntegerAmount(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new ConvexError(`${fieldName} must be a non-negative integer`)
  }
}

async function getAccountOrThrow(ctx: AppCtx, accountId: Id<'accounts'>) {
  const account = await ctx.db.get(accountId)
  if (!account) {
    throw new ConvexError('Account not found')
  }
  return account
}

async function getCategoryOrThrow(ctx: AppCtx, categoryId: Id<'categories'>) {
  const category = await ctx.db.get(categoryId)
  if (!category) {
    throw new ConvexError('Category not found')
  }
  return category
}

function ensureAccountInLedger(account: Doc<'accounts'>, ledgerId: Id<'ledgers'>) {
  if (account.ledgerId !== ledgerId) {
    throw new ConvexError('Account does not belong to ledger')
  }
}

function ensureCategoryInLedger(category: Doc<'categories'>, ledgerId: Id<'ledgers'>) {
  if (category.ledgerId !== ledgerId) {
    throw new ConvexError('Category does not belong to ledger')
  }
}

export const list = query({
  args: {
    accountId: v.optional(v.id('accounts')),
    categoryId: v.optional(v.id('categories')),
    from: v.optional(v.number()),
    ledgerId: v.id('ledgers'),
    limit: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    minAmount: v.optional(v.number()),
    search: v.optional(v.string()),
    to: v.optional(v.number()),
    type: v.optional(transactionTypeValidator),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)

    if (args.from !== undefined) {
      assertTimestamp(args.from, 'from')
    }
    if (args.to !== undefined) {
      assertTimestamp(args.to, 'to')
    }
    if (args.from !== undefined && args.to !== undefined && args.from > args.to) {
      throw new ConvexError('from must be less than or equal to to')
    }
    if (args.minAmount !== undefined) {
      assertNonNegativeIntegerAmount(args.minAmount, 'minAmount')
    }
    if (args.maxAmount !== undefined) {
      assertNonNegativeIntegerAmount(args.maxAmount, 'maxAmount')
    }
    if (
      args.minAmount !== undefined &&
      args.maxAmount !== undefined &&
      args.minAmount > args.maxAmount
    ) {
      throw new ConvexError('minAmount must be less than or equal to maxAmount')
    }

    const limit = args.limit ?? 100
    if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
      throw new ConvexError('limit must be an integer between 1 and 500')
    }

    const from = args.from ?? 0
    const to = args.to ?? Number.MAX_SAFE_INTEGER
    const keyword = args.search?.trim().toLowerCase()

    // Prefer narrower indexes, then only apply in-memory filters when required.
    const baseQuery = (() => {
      if (args.categoryId !== undefined) {
        return ctx.db
          .query('transactions')
          .withIndex('by_ledger_category_occurredAt', (q) =>
            q
              .eq('ledgerId', args.ledgerId)
              .eq('categoryId', args.categoryId)
              .gte('occurredAt', from)
              .lte('occurredAt', to),
          )
          .order('desc')
      }
      if (args.type !== undefined) {
        const type = args.type
        return ctx.db
          .query('transactions')
          .withIndex('by_ledger_type_occurredAt', (q) =>
            q
              .eq('ledgerId', args.ledgerId)
              .eq('type', type)
              .gte('occurredAt', from)
              .lte('occurredAt', to),
          )
          .order('desc')
      }
      return ctx.db
        .query('transactions')
        .withIndex('by_ledger_occurredAt', (q) =>
          q.eq('ledgerId', args.ledgerId).gte('occurredAt', from).lte('occurredAt', to),
        )
        .order('desc')
    })()

    const requiresPostFilter =
      args.accountId !== undefined ||
      args.minAmount !== undefined ||
      args.maxAmount !== undefined ||
      (args.type !== undefined && args.categoryId !== undefined) ||
      Boolean(keyword && keyword.length > 0)

    if (!requiresPostFilter) {
      return await baseQuery.take(limit)
    }

    const docs: Doc<'transactions'>[] = []
    for await (const doc of baseQuery) {
      if (args.type !== undefined && doc.type !== args.type) {
        continue
      }
      if (
        args.accountId !== undefined &&
        doc.accountId !== args.accountId &&
        doc.transferAccountId !== args.accountId
      ) {
        continue
      }
      if (args.categoryId !== undefined && doc.categoryId !== args.categoryId) {
        continue
      }
      if (args.minAmount !== undefined && doc.amount < args.minAmount) {
        continue
      }
      if (args.maxAmount !== undefined && doc.amount > args.maxAmount) {
        continue
      }
      if (keyword && keyword.length > 0 && !(doc.note ?? '').toLowerCase().includes(keyword)) {
        continue
      }

      docs.push(doc)
      if (docs.length >= limit) {
        break
      }
    }

    return docs
  },
})

export const createExpense = mutation({
  args: {
    accountId: v.id('accounts'),
    amount: v.number(),
    categoryId: v.id('categories'),
    ledgerId: v.id('ledgers'),
    note: v.optional(v.string()),
    occurredAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)
    assertPositiveIntegerAmount(args.amount, 'amount')
    assertTimestamp(args.occurredAt, 'occurredAt')

    const account = await getAccountOrThrow(ctx, args.accountId)
    ensureAccountInLedger(account, args.ledgerId)
    if (account.status !== 'active') {
      throw new ConvexError('Account is inactive')
    }

    const category = await getCategoryOrThrow(ctx, args.categoryId)
    ensureCategoryInLedger(category, args.ledgerId)
    if (category.type !== 'expense') {
      throw new ConvexError('Category type must be expense')
    }
    if (category.status !== 'active') {
      throw new ConvexError('Category is inactive')
    }

    const note = normalizeOptionalNote(args.note)
    const now = Date.now()
    const transactionId = await ctx.db.insert('transactions', {
      accountId: args.accountId,
      amount: args.amount,
      categoryId: args.categoryId,
      ledgerId: args.ledgerId,
      occurredAt: args.occurredAt,
      type: 'expense',
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(args.accountId, {
      currentBalance: account.currentBalance - args.amount,
      updatedAt: now,
    })

    return await ctx.db.get(transactionId)
  },
})

export const createIncome = mutation({
  args: {
    accountId: v.id('accounts'),
    amount: v.number(),
    categoryId: v.id('categories'),
    ledgerId: v.id('ledgers'),
    note: v.optional(v.string()),
    occurredAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)
    assertPositiveIntegerAmount(args.amount, 'amount')
    assertTimestamp(args.occurredAt, 'occurredAt')

    const account = await getAccountOrThrow(ctx, args.accountId)
    ensureAccountInLedger(account, args.ledgerId)
    if (account.status !== 'active') {
      throw new ConvexError('Account is inactive')
    }

    const category = await getCategoryOrThrow(ctx, args.categoryId)
    ensureCategoryInLedger(category, args.ledgerId)
    if (category.type !== 'income') {
      throw new ConvexError('Category type must be income')
    }
    if (category.status !== 'active') {
      throw new ConvexError('Category is inactive')
    }

    const note = normalizeOptionalNote(args.note)
    const now = Date.now()
    const transactionId = await ctx.db.insert('transactions', {
      accountId: args.accountId,
      amount: args.amount,
      categoryId: args.categoryId,
      ledgerId: args.ledgerId,
      occurredAt: args.occurredAt,
      type: 'income',
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(args.accountId, {
      currentBalance: account.currentBalance + args.amount,
      updatedAt: now,
    })

    return await ctx.db.get(transactionId)
  },
})

export const createTransfer = mutation({
  args: {
    amount: v.number(),
    fromAccountId: v.id('accounts'),
    ledgerId: v.id('ledgers'),
    note: v.optional(v.string()),
    occurredAt: v.number(),
    toAccountId: v.id('accounts'),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)
    assertPositiveIntegerAmount(args.amount, 'amount')
    assertTimestamp(args.occurredAt, 'occurredAt')

    if (args.fromAccountId === args.toAccountId) {
      throw new ConvexError('fromAccountId and toAccountId must be different')
    }

    const fromAccount = await getAccountOrThrow(ctx, args.fromAccountId)
    const toAccount = await getAccountOrThrow(ctx, args.toAccountId)
    ensureAccountInLedger(fromAccount, args.ledgerId)
    ensureAccountInLedger(toAccount, args.ledgerId)

    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      throw new ConvexError('Transfer accounts must be active')
    }

    const note = normalizeOptionalNote(args.note)
    const now = Date.now()
    const transactionId = await ctx.db.insert('transactions', {
      accountId: args.fromAccountId,
      amount: args.amount,
      ledgerId: args.ledgerId,
      occurredAt: args.occurredAt,
      transferAccountId: args.toAccountId,
      type: 'transfer',
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(args.fromAccountId, {
      currentBalance: fromAccount.currentBalance - args.amount,
      updatedAt: now,
    })
    await ctx.db.patch(args.toAccountId, {
      currentBalance: toAccount.currentBalance + args.amount,
      updatedAt: now,
    })

    return await ctx.db.get(transactionId)
  },
})

export const update = mutation({
  args: {
    accountId: v.optional(v.id('accounts')),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.id('categories')),
    clearNote: v.optional(v.boolean()),
    note: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
    transactionId: v.id('transactions'),
    transferAccountId: v.optional(v.id('accounts')),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId)
    if (!transaction) {
      throw new ConvexError('Transaction not found')
    }

    await requireLedgerOwner(ctx, transaction.ledgerId)

    let nextAmount = transaction.amount
    if (args.amount !== undefined) {
      assertPositiveIntegerAmount(args.amount, 'amount')
      nextAmount = args.amount
    }

    const patch: {
      accountId?: Id<'accounts'>
      transferAccountId?: Id<'accounts'>
      amount?: number
      occurredAt?: number
      categoryId?: Id<'categories'>
      note?: string
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.amount !== undefined) {
      patch.amount = args.amount
    }
    if (args.accountId !== undefined) {
      patch.accountId = args.accountId
    }
    if (args.transferAccountId !== undefined) {
      patch.transferAccountId = args.transferAccountId
    }
    if (args.occurredAt !== undefined) {
      assertTimestamp(args.occurredAt, 'occurredAt')
      patch.occurredAt = args.occurredAt
    }
    if (args.clearNote) {
      if (args.note !== undefined) {
        throw new ConvexError('note and clearNote cannot be used together')
      }
      patch.note = ''
    }
    if (args.note !== undefined) {
      const note = args.note.trim()
      if (note.length === 0) {
        throw new ConvexError('note cannot be empty')
      }
      patch.note = note
    }

    if (transaction.type === 'transfer') {
      if (args.categoryId !== undefined) {
        throw new ConvexError('Transfer transaction cannot set categoryId')
      }

      const oldFromAccountId = transaction.accountId
      const oldToAccountId = transaction.transferAccountId
      if (!oldToAccountId) {
        throw new ConvexError('Transfer transaction is missing transferAccountId')
      }

      const nextFromAccountId = args.accountId ?? oldFromAccountId
      const nextToAccountId = args.transferAccountId ?? oldToAccountId

      if (nextFromAccountId === nextToAccountId) {
        throw new ConvexError('fromAccountId and toAccountId must be different')
      }

      if (args.accountId !== undefined && args.accountId !== oldFromAccountId) {
        const nextFromAccount = await getAccountOrThrow(ctx, nextFromAccountId)
        ensureAccountInLedger(nextFromAccount, transaction.ledgerId)
        if (nextFromAccount.status !== 'active') {
          throw new ConvexError('Account is inactive')
        }
      }
      if (args.transferAccountId !== undefined && args.transferAccountId !== oldToAccountId) {
        const nextToAccount = await getAccountOrThrow(ctx, nextToAccountId)
        ensureAccountInLedger(nextToAccount, transaction.ledgerId)
        if (nextToAccount.status !== 'active') {
          throw new ConvexError('Transfer account is inactive')
        }
      }

      if (
        args.amount !== undefined ||
        args.accountId !== undefined ||
        args.transferAccountId !== undefined
      ) {
        const affectedAccountIds = new Set<Id<'accounts'>>([
          oldFromAccountId,
          oldToAccountId,
          nextFromAccountId,
          nextToAccountId,
        ])
        const accounts = new Map<Id<'accounts'>, Doc<'accounts'>>()
        for (const accountId of affectedAccountIds) {
          const account = await getAccountOrThrow(ctx, accountId)
          accounts.set(accountId, account)
        }

        const deltas = new Map<Id<'accounts'>, number>()
        const addDelta = (accountId: Id<'accounts'>, delta: number) => {
          deltas.set(accountId, (deltas.get(accountId) ?? 0) + delta)
        }

        addDelta(oldFromAccountId, transaction.amount)
        addDelta(oldToAccountId, -transaction.amount)
        addDelta(nextFromAccountId, -nextAmount)
        addDelta(nextToAccountId, nextAmount)

        for (const [accountId, delta] of deltas) {
          if (delta === 0) {
            continue
          }
          const account = accounts.get(accountId)
          if (!account) {
            throw new ConvexError('Account not found')
          }
          await ctx.db.patch(accountId, {
            currentBalance: account.currentBalance + delta,
            updatedAt: patch.updatedAt,
          })
        }
      }
    } else {
      if (args.transferAccountId !== undefined) {
        throw new ConvexError('Non-transfer transaction cannot set transferAccountId')
      }

      const nextAccountId = args.accountId ?? transaction.accountId
      if (args.accountId !== undefined && args.accountId !== transaction.accountId) {
        const nextAccount = await getAccountOrThrow(ctx, nextAccountId)
        ensureAccountInLedger(nextAccount, transaction.ledgerId)
        if (nextAccount.status !== 'active') {
          throw new ConvexError('Account is inactive')
        }
      }

      if (args.categoryId !== undefined) {
        const category = await getCategoryOrThrow(ctx, args.categoryId)
        ensureCategoryInLedger(category, transaction.ledgerId)
        if (category.type !== transaction.type) {
          throw new ConvexError('Category type mismatch')
        }
        if (category.status !== 'active') {
          throw new ConvexError('Category is inactive')
        }
        patch.categoryId = args.categoryId
      }

      if (args.amount !== undefined || args.accountId !== undefined) {
        const oldAccount = await getAccountOrThrow(ctx, transaction.accountId)
        const targetAccount =
          nextAccountId === transaction.accountId
            ? oldAccount
            : await getAccountOrThrow(ctx, nextAccountId)
        ensureAccountInLedger(oldAccount, transaction.ledgerId)
        ensureAccountInLedger(targetAccount, transaction.ledgerId)

        const sign = transaction.type === 'expense' ? -1 : 1
        const deltas = new Map<Id<'accounts'>, number>()
        const addDelta = (accountId: Id<'accounts'>, delta: number) => {
          deltas.set(accountId, (deltas.get(accountId) ?? 0) + delta)
        }

        addDelta(transaction.accountId, -sign * transaction.amount)
        addDelta(nextAccountId, sign * nextAmount)

        for (const [accountId, delta] of deltas) {
          if (delta === 0) {
            continue
          }
          const account =
            accountId === oldAccount._id
              ? oldAccount
              : accountId === targetAccount._id
                ? targetAccount
                : await getAccountOrThrow(ctx, accountId)
          await ctx.db.patch(accountId, {
            currentBalance: account.currentBalance + delta,
            updatedAt: patch.updatedAt,
          })
        }
      }
    }

    await ctx.db.patch(args.transactionId, patch)
    return await ctx.db.get(args.transactionId)
  },
})

export const remove = mutation({
  args: {
    transactionId: v.id('transactions'),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId)
    if (!transaction) {
      throw new ConvexError('Transaction not found')
    }

    await requireLedgerOwner(ctx, transaction.ledgerId)
    const updatedAt = Date.now()

    if (transaction.type === 'expense') {
      const account = await getAccountOrThrow(ctx, transaction.accountId)
      await ctx.db.patch(transaction.accountId, {
        currentBalance: account.currentBalance + transaction.amount,
        updatedAt,
      })
    } else if (transaction.type === 'income') {
      const account = await getAccountOrThrow(ctx, transaction.accountId)
      await ctx.db.patch(transaction.accountId, {
        currentBalance: account.currentBalance - transaction.amount,
        updatedAt,
      })
    } else {
      const toAccountId = transaction.transferAccountId
      if (!toAccountId) {
        throw new ConvexError('Transfer transaction is missing transferAccountId')
      }
      const fromAccount = await getAccountOrThrow(ctx, transaction.accountId)
      const toAccount = await getAccountOrThrow(ctx, toAccountId)
      await ctx.db.patch(transaction.accountId, {
        currentBalance: fromAccount.currentBalance + transaction.amount,
        updatedAt,
      })
      await ctx.db.patch(toAccountId, {
        currentBalance: toAccount.currentBalance - transaction.amount,
        updatedAt,
      })
    }

    await ctx.db.delete(args.transactionId)
    return { transactionId: args.transactionId }
  },
})
