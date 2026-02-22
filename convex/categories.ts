import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireLedgerOwner } from './lib/auth'
import { normalizeRequiredName } from './lib/validation'

const categoryTypeValidator = v.union(v.literal('expense'), v.literal('income'))
const categoryStatusValidator = v.union(v.literal('active'), v.literal('inactive'))

export const list = query({
  args: {
    ledgerId: v.id('ledgers'),
    status: v.optional(categoryStatusValidator),
    type: v.optional(categoryTypeValidator),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)

    let docs: Doc<'categories'>[]
    if (args.type !== undefined) {
      const type = args.type
      docs = await ctx.db
        .query('categories')
        .withIndex('by_ledger_type', (q) => q.eq('ledgerId', args.ledgerId).eq('type', type))
        .collect()
    } else if (args.status !== undefined) {
      const status = args.status
      docs = await ctx.db
        .query('categories')
        .withIndex('by_ledger_status', (q) => q.eq('ledgerId', args.ledgerId).eq('status', status))
        .collect()
    } else {
      docs = await ctx.db
        .query('categories')
        .withIndex('by_ledger', (q) => q.eq('ledgerId', args.ledgerId))
        .collect()
    }

    if (args.type !== undefined) {
      docs = docs.filter((doc) => doc.type === args.type)
    }
    if (args.status !== undefined) {
      docs = docs.filter((doc) => doc.status === args.status)
    }
    return docs
  },
})

export const create = mutation({
  args: {
    isSystem: v.optional(v.boolean()),
    ledgerId: v.id('ledgers'),
    name: v.string(),
    type: categoryTypeValidator,
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId)

    const name = normalizeRequiredName(args.name, 'name')
    const existing = await ctx.db
      .query('categories')
      .withIndex('by_ledger_type', (q) => q.eq('ledgerId', args.ledgerId).eq('type', args.type))
      .collect()

    if (existing.some((doc) => doc.name.toLowerCase() === name.toLowerCase())) {
      throw new ConvexError('Category already exists')
    }

    const now = Date.now()
    const categoryId = await ctx.db.insert('categories', {
      createdAt: now,
      isSystem: args.isSystem ?? false,
      ledgerId: args.ledgerId,
      name,
      status: 'active',
      type: args.type,
      updatedAt: now,
    })

    return await ctx.db.get(categoryId)
  },
})

export const update = mutation({
  args: {
    categoryId: v.id('categories'),
    name: v.optional(v.string()),
    status: v.optional(categoryStatusValidator),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)
    if (!category) {
      throw new ConvexError('Category not found')
    }

    await requireLedgerOwner(ctx, category.ledgerId)

    const patch: {
      name?: string
      status?: 'active' | 'inactive'
      updatedAt: number
    } = { updatedAt: Date.now() }

    if (args.name !== undefined) {
      patch.name = normalizeRequiredName(args.name, 'name')
    }
    if (args.status !== undefined) {
      patch.status = args.status
    }

    await ctx.db.patch(args.categoryId, patch)
    return await ctx.db.get(args.categoryId)
  },
})
