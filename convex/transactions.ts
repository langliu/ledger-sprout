import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireLedgerOwner } from "./lib/auth";
import {
  assertPositiveIntegerAmount,
  assertTimestamp,
  normalizeOptionalNote,
} from "./lib/validation";

type AppCtx = QueryCtx | MutationCtx;

const transactionTypeValidator = v.union(
  v.literal("expense"),
  v.literal("income"),
  v.literal("transfer"),
);

async function getAccountOrThrow(ctx: AppCtx, accountId: Id<"accounts">) {
  const account = await ctx.db.get(accountId);
  if (!account) {
    throw new ConvexError("Account not found");
  }
  return account;
}

async function getCategoryOrThrow(ctx: AppCtx, categoryId: Id<"categories">) {
  const category = await ctx.db.get(categoryId);
  if (!category) {
    throw new ConvexError("Category not found");
  }
  return category;
}

function ensureAccountInLedger(account: Doc<"accounts">, ledgerId: Id<"ledgers">) {
  if (account.ledgerId !== ledgerId) {
    throw new ConvexError("Account does not belong to ledger");
  }
}

function ensureCategoryInLedger(
  category: Doc<"categories">,
  ledgerId: Id<"ledgers">,
) {
  if (category.ledgerId !== ledgerId) {
    throw new ConvexError("Category does not belong to ledger");
  }
}

export const list = query({
  args: {
    ledgerId: v.id("ledgers"),
    type: v.optional(transactionTypeValidator),
    accountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);

    if (args.from !== undefined) {
      assertTimestamp(args.from, "from");
    }
    if (args.to !== undefined) {
      assertTimestamp(args.to, "to");
    }
    if (args.from !== undefined && args.to !== undefined && args.from > args.to) {
      throw new ConvexError("from must be less than or equal to to");
    }

    const limit = args.limit ?? 100;
    if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
      throw new ConvexError("limit must be an integer between 1 and 500");
    }

    const from = args.from ?? 0;
    const to = args.to ?? Number.MAX_SAFE_INTEGER;

    let docs = await ctx.db
      .query("transactions")
      .withIndex("by_ledger_occurredAt", (q) =>
        q.eq("ledgerId", args.ledgerId).gte("occurredAt", from).lte("occurredAt", to),
      )
      .order("desc")
      .collect();

    if (args.type !== undefined) {
      docs = docs.filter((doc) => doc.type === args.type);
    }
    if (args.accountId !== undefined) {
      docs = docs.filter(
        (doc) =>
          doc.accountId === args.accountId ||
          doc.transferAccountId === args.accountId,
      );
    }
    if (args.categoryId !== undefined) {
      docs = docs.filter((doc) => doc.categoryId === args.categoryId);
    }
    if (args.search !== undefined) {
      const keyword = args.search.trim().toLowerCase();
      if (keyword.length > 0) {
        docs = docs.filter((doc) => (doc.note ?? "").toLowerCase().includes(keyword));
      }
    }

    return docs.slice(0, limit);
  },
});

export const createExpense = mutation({
  args: {
    ledgerId: v.id("ledgers"),
    accountId: v.id("accounts"),
    categoryId: v.id("categories"),
    amount: v.number(),
    occurredAt: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);
    assertPositiveIntegerAmount(args.amount, "amount");
    assertTimestamp(args.occurredAt, "occurredAt");

    const account = await getAccountOrThrow(ctx, args.accountId);
    ensureAccountInLedger(account, args.ledgerId);
    if (account.status !== "active") {
      throw new ConvexError("Account is inactive");
    }

    const category = await getCategoryOrThrow(ctx, args.categoryId);
    ensureCategoryInLedger(category, args.ledgerId);
    if (category.type !== "expense") {
      throw new ConvexError("Category type must be expense");
    }
    if (category.status !== "active") {
      throw new ConvexError("Category is inactive");
    }

    const note = normalizeOptionalNote(args.note);
    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      ledgerId: args.ledgerId,
      accountId: args.accountId,
      type: "expense",
      amount: args.amount,
      occurredAt: args.occurredAt,
      categoryId: args.categoryId,
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.accountId, {
      currentBalance: account.currentBalance - args.amount,
      updatedAt: now,
    });

    return await ctx.db.get(transactionId);
  },
});

export const createIncome = mutation({
  args: {
    ledgerId: v.id("ledgers"),
    accountId: v.id("accounts"),
    categoryId: v.id("categories"),
    amount: v.number(),
    occurredAt: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);
    assertPositiveIntegerAmount(args.amount, "amount");
    assertTimestamp(args.occurredAt, "occurredAt");

    const account = await getAccountOrThrow(ctx, args.accountId);
    ensureAccountInLedger(account, args.ledgerId);
    if (account.status !== "active") {
      throw new ConvexError("Account is inactive");
    }

    const category = await getCategoryOrThrow(ctx, args.categoryId);
    ensureCategoryInLedger(category, args.ledgerId);
    if (category.type !== "income") {
      throw new ConvexError("Category type must be income");
    }
    if (category.status !== "active") {
      throw new ConvexError("Category is inactive");
    }

    const note = normalizeOptionalNote(args.note);
    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      ledgerId: args.ledgerId,
      accountId: args.accountId,
      type: "income",
      amount: args.amount,
      occurredAt: args.occurredAt,
      categoryId: args.categoryId,
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.accountId, {
      currentBalance: account.currentBalance + args.amount,
      updatedAt: now,
    });

    return await ctx.db.get(transactionId);
  },
});

export const createTransfer = mutation({
  args: {
    ledgerId: v.id("ledgers"),
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
    amount: v.number(),
    occurredAt: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);
    assertPositiveIntegerAmount(args.amount, "amount");
    assertTimestamp(args.occurredAt, "occurredAt");

    if (args.fromAccountId === args.toAccountId) {
      throw new ConvexError("fromAccountId and toAccountId must be different");
    }

    const fromAccount = await getAccountOrThrow(ctx, args.fromAccountId);
    const toAccount = await getAccountOrThrow(ctx, args.toAccountId);
    ensureAccountInLedger(fromAccount, args.ledgerId);
    ensureAccountInLedger(toAccount, args.ledgerId);

    if (fromAccount.status !== "active" || toAccount.status !== "active") {
      throw new ConvexError("Transfer accounts must be active");
    }

    const note = normalizeOptionalNote(args.note);
    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      ledgerId: args.ledgerId,
      accountId: args.fromAccountId,
      type: "transfer",
      amount: args.amount,
      occurredAt: args.occurredAt,
      transferAccountId: args.toAccountId,
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.fromAccountId, {
      currentBalance: fromAccount.currentBalance - args.amount,
      updatedAt: now,
    });
    await ctx.db.patch(args.toAccountId, {
      currentBalance: toAccount.currentBalance + args.amount,
      updatedAt: now,
    });

    return await ctx.db.get(transactionId);
  },
});

export const update = mutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.optional(v.number()),
    occurredAt: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    note: v.optional(v.string()),
    clearNote: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError("Transaction not found");
    }

    await requireLedgerOwner(ctx, transaction.ledgerId);

    let nextAmount = transaction.amount;
    if (args.amount !== undefined) {
      assertPositiveIntegerAmount(args.amount, "amount");
      nextAmount = args.amount;
    }

    const patch: {
      amount?: number;
      occurredAt?: number;
      categoryId?: Id<"categories">;
      note?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.amount !== undefined) {
      patch.amount = args.amount;
    }
    if (args.occurredAt !== undefined) {
      assertTimestamp(args.occurredAt, "occurredAt");
      patch.occurredAt = args.occurredAt;
    }
    if (args.clearNote) {
      if (args.note !== undefined) {
        throw new ConvexError("note and clearNote cannot be used together");
      }
      patch.note = "";
    }
    if (args.note !== undefined) {
      const note = args.note.trim();
      if (note.length === 0) {
        throw new ConvexError("note cannot be empty");
      }
      patch.note = note;
    }

    if (transaction.type === "transfer") {
      if (args.categoryId !== undefined) {
        throw new ConvexError("Transfer transaction cannot set categoryId");
      }

      if (args.amount !== undefined) {
        const fromAccount = await getAccountOrThrow(ctx, transaction.accountId);
        const toAccountId = transaction.transferAccountId;
        if (!toAccountId) {
          throw new ConvexError("Transfer transaction is missing transferAccountId");
        }
        const toAccount = await getAccountOrThrow(ctx, toAccountId);
        const delta = nextAmount - transaction.amount;

        await ctx.db.patch(transaction.accountId, {
          currentBalance: fromAccount.currentBalance - delta,
          updatedAt: patch.updatedAt,
        });
        await ctx.db.patch(toAccountId, {
          currentBalance: toAccount.currentBalance + delta,
          updatedAt: patch.updatedAt,
        });
      }
    } else {
      if (args.categoryId !== undefined) {
        const category = await getCategoryOrThrow(ctx, args.categoryId);
        ensureCategoryInLedger(category, transaction.ledgerId);
        if (category.type !== transaction.type) {
          throw new ConvexError("Category type mismatch");
        }
        if (category.status !== "active") {
          throw new ConvexError("Category is inactive");
        }
        patch.categoryId = args.categoryId;
      }

      if (args.amount !== undefined) {
        const account = await getAccountOrThrow(ctx, transaction.accountId);
        const delta = nextAmount - transaction.amount;
        const balanceDelta = transaction.type === "expense" ? -delta : delta;
        await ctx.db.patch(transaction.accountId, {
          currentBalance: account.currentBalance + balanceDelta,
          updatedAt: patch.updatedAt,
        });
      }
    }

    await ctx.db.patch(args.transactionId, patch);
    return await ctx.db.get(args.transactionId);
  },
});

export const remove = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError("Transaction not found");
    }

    await requireLedgerOwner(ctx, transaction.ledgerId);
    const updatedAt = Date.now();

    if (transaction.type === "expense") {
      const account = await getAccountOrThrow(ctx, transaction.accountId);
      await ctx.db.patch(transaction.accountId, {
        currentBalance: account.currentBalance + transaction.amount,
        updatedAt,
      });
    } else if (transaction.type === "income") {
      const account = await getAccountOrThrow(ctx, transaction.accountId);
      await ctx.db.patch(transaction.accountId, {
        currentBalance: account.currentBalance - transaction.amount,
        updatedAt,
      });
    } else {
      const toAccountId = transaction.transferAccountId;
      if (!toAccountId) {
        throw new ConvexError("Transfer transaction is missing transferAccountId");
      }
      const fromAccount = await getAccountOrThrow(ctx, transaction.accountId);
      const toAccount = await getAccountOrThrow(ctx, toAccountId);
      await ctx.db.patch(transaction.accountId, {
        currentBalance: fromAccount.currentBalance + transaction.amount,
        updatedAt,
      });
      await ctx.db.patch(toAccountId, {
        currentBalance: toAccount.currentBalance - transaction.amount,
        updatedAt,
      });
    }

    await ctx.db.delete(args.transactionId);
    return { transactionId: args.transactionId };
  },
});
