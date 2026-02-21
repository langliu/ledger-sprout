import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { tables } from "./betterAuth/schema";

const schema = defineSchema({
  ...tables,
  ledgers: defineTable({
    userId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"]),
  accounts: defineTable({
    ledgerId: v.id("ledgers"),
    name: v.string(),
    type: v.union(
      v.literal("cash"),
      v.literal("bank"),
      v.literal("credit"),
      v.literal("wallet"),
    ),
    initialBalance: v.number(),
    currentBalance: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ledger", ["ledgerId"])
    .index("by_ledger_status", ["ledgerId", "status"]),
  categories: defineTable({
    ledgerId: v.id("ledgers"),
    name: v.string(),
    type: v.union(v.literal("expense"), v.literal("income")),
    isSystem: v.boolean(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ledger", ["ledgerId"])
    .index("by_ledger_type", ["ledgerId", "type"])
    .index("by_ledger_status", ["ledgerId", "status"]),
  transactions: defineTable({
    ledgerId: v.id("ledgers"),
    accountId: v.id("accounts"),
    type: v.union(
      v.literal("expense"),
      v.literal("income"),
      v.literal("transfer"),
    ),
    amount: v.number(),
    occurredAt: v.number(),
    categoryId: v.optional(v.id("categories")),
    note: v.optional(v.string()),
    transferAccountId: v.optional(v.id("accounts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ledger_occurredAt", ["ledgerId", "occurredAt"])
    .index("by_account_occurredAt", ["accountId", "occurredAt"]),
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.optional(v.boolean()),
  }),
});

export default schema;
