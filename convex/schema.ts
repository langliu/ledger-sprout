import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { tables } from './betterAuth/schema'

const schema = defineSchema({
  ...tables,
  accounts: defineTable({
    createdAt: v.number(),
    currentBalance: v.number(),
    initialBalance: v.number(),
    ledgerId: v.id('ledgers'),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    type: v.union(v.literal('cash'), v.literal('bank'), v.literal('credit'), v.literal('wallet')),
    updatedAt: v.number(),
  })
    .index('by_ledger', ['ledgerId'])
    .index('by_ledger_status', ['ledgerId', 'status']),
  balanceAdjustments: defineTable({
    accountId: v.id('accounts'),
    actorUserId: v.string(),
    createdAt: v.number(),
    delta: v.number(),
    ledgerId: v.id('ledgers'),
    reason: v.optional(v.string()),
  })
    .index('by_ledger_createdAt', ['ledgerId', 'createdAt'])
    .index('by_account_createdAt', ['accountId', 'createdAt']),
  categories: defineTable({
    createdAt: v.number(),
    isSystem: v.boolean(),
    ledgerId: v.id('ledgers'),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    type: v.union(v.literal('expense'), v.literal('income')),
    updatedAt: v.number(),
  })
    .index('by_ledger', ['ledgerId'])
    .index('by_ledger_type', ['ledgerId', 'type'])
    .index('by_ledger_status', ['ledgerId', 'status']),
  ledgers: defineTable({
    createdAt: v.number(),
    isDefault: v.boolean(),
    name: v.string(),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_default', ['userId', 'isDefault']),
  tasks: defineTable({
    isCompleted: v.optional(v.boolean()),
    text: v.string(),
  }),
  transactions: defineTable({
    accountId: v.id('accounts'),
    amount: v.number(),
    categoryId: v.optional(v.id('categories')),
    createdAt: v.number(),
    ledgerId: v.id('ledgers'),
    note: v.optional(v.string()),
    occurredAt: v.number(),
    transferAccountId: v.optional(v.id('accounts')),
    type: v.union(v.literal('expense'), v.literal('income'), v.literal('transfer')),
    updatedAt: v.number(),
  })
    .index('by_ledger_occurredAt', ['ledgerId', 'occurredAt'])
    .index('by_account_occurredAt', ['accountId', 'occurredAt'])
    .index('by_ledger_type_occurredAt', ['ledgerId', 'type', 'occurredAt'])
    .index('by_ledger_category_occurredAt', ['ledgerId', 'categoryId', 'occurredAt']),
})

export default schema
