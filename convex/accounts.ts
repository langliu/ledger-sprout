import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireLedgerOwner } from "./lib/auth";
import {
  assertIntegerAmount,
  normalizeRequiredName,
} from "./lib/validation";

const accountTypeValidator = v.union(
  v.literal("cash"),
  v.literal("bank"),
  v.literal("credit"),
  v.literal("wallet"),
);

const accountStatusValidator = v.union(
  v.literal("active"),
  v.literal("inactive"),
);

export const list = query({
  args: {
    ledgerId: v.id("ledgers"),
    status: v.optional(accountStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);

    if (args.status) {
      return await ctx.db
        .query("accounts")
        .withIndex("by_ledger_status", (q) =>
          q.eq("ledgerId", args.ledgerId).eq("status", args.status!),
        )
        .collect();
    }

    return await ctx.db
      .query("accounts")
      .withIndex("by_ledger", (q) => q.eq("ledgerId", args.ledgerId))
      .collect();
  },
});

export const create = mutation({
  args: {
    ledgerId: v.id("ledgers"),
    name: v.string(),
    type: accountTypeValidator,
    initialBalance: v.number(),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);

    const name = normalizeRequiredName(args.name, "name");
    assertIntegerAmount(args.initialBalance, "initialBalance");

    const now = Date.now();
    const accountId = await ctx.db.insert("accounts", {
      ledgerId: args.ledgerId,
      name,
      type: args.type,
      initialBalance: args.initialBalance,
      currentBalance: args.initialBalance,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(accountId);
  },
});

export const update = mutation({
  args: {
    accountId: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(accountTypeValidator),
    status: v.optional(accountStatusValidator),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new ConvexError("Account not found");
    }

    await requireLedgerOwner(ctx, account.ledgerId);

    const patch: {
      name?: string;
      type?: "cash" | "bank" | "credit" | "wallet";
      status?: "active" | "inactive";
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      patch.name = normalizeRequiredName(args.name, "name");
    }
    if (args.type !== undefined) {
      patch.type = args.type;
    }
    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(args.accountId, patch);
    return await ctx.db.get(args.accountId);
  },
});

export const adjustBalance = mutation({
  args: {
    accountId: v.id("accounts"),
    delta: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new ConvexError("Account not found");
    }

    await requireLedgerOwner(ctx, account.ledgerId);
    assertIntegerAmount(args.delta, "delta");

    if (args.reason !== undefined) {
      const reason = args.reason.trim();
      if (reason.length === 0) {
        throw new ConvexError("reason cannot be empty");
      }
    }

    await ctx.db.patch(args.accountId, {
      currentBalance: account.currentBalance + args.delta,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.accountId);
  },
});
