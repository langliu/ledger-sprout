import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireLedgerOwner } from "./lib/auth";
import { assertTimestamp } from "./lib/validation";

const breakdownTypeValidator = v.union(v.literal("expense"), v.literal("income"));
const granularityValidator = v.union(v.literal("day"), v.literal("month"));

function getMonthRange(year: number, month: number) {
  if (!Number.isInteger(year) || year < 1970 || year > 9999) {
    throw new ConvexError("year must be a valid integer");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ConvexError("month must be an integer between 1 and 12");
  }
  const start = Date.UTC(year, month - 1, 1);
  const end = Date.UTC(year, month, 1) - 1;
  return { start, end };
}

function getBucketKey(timestamp: number, granularity: "day" | "month") {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  if (granularity === "month") {
    return `${year}-${month}`;
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const monthlySummary = query({
  args: {
    ledgerId: v.id("ledgers"),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);
    const { start, end } = getMonthRange(args.year, args.month);

    const docs = await ctx.db
      .query("transactions")
      .withIndex("by_ledger_occurredAt", (q) =>
        q.eq("ledgerId", args.ledgerId).gte("occurredAt", start).lte("occurredAt", end),
      )
      .collect();

    let income = 0;
    let expense = 0;
    let transfer = 0;

    for (const doc of docs) {
      if (doc.type === "income") {
        income += doc.amount;
      } else if (doc.type === "expense") {
        expense += doc.amount;
      } else {
        transfer += doc.amount;
      }
    }

    return {
      year: args.year,
      month: args.month,
      income,
      expense,
      transfer,
      net: income - expense,
      transactionCount: docs.length,
    };
  },
});

export const categoryBreakdown = query({
  args: {
    ledgerId: v.id("ledgers"),
    year: v.number(),
    month: v.number(),
    type: breakdownTypeValidator,
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);
    const { start, end } = getMonthRange(args.year, args.month);

    const [transactions, categories] = await Promise.all([
      ctx.db
        .query("transactions")
        .withIndex("by_ledger_occurredAt", (q) =>
          q.eq("ledgerId", args.ledgerId).gte("occurredAt", start).lte("occurredAt", end),
        )
        .collect(),
      ctx.db
        .query("categories")
        .withIndex("by_ledger", (q) => q.eq("ledgerId", args.ledgerId))
        .collect(),
    ]);

    const categoryMap = new Map(categories.map((category) => [category._id, category]));
    const total = transactions
      .filter((tx) => tx.type === args.type)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const buckets = new Map<Id<"categories">, { amount: number; count: number }>();

    for (const tx of transactions) {
      if (tx.type !== args.type || !tx.categoryId) {
        continue;
      }
      const key = tx.categoryId;
      const prev = buckets.get(key) ?? { amount: 0, count: 0 };
      buckets.set(key, {
        amount: prev.amount + tx.amount,
        count: prev.count + 1,
      });
    }

    return Array.from(buckets.entries())
      .map(([categoryId, value]) => {
        const category = categoryMap.get(categoryId);
        return {
          categoryId,
          categoryName: category?.name ?? "未分类",
          amount: value.amount,
          count: value.count,
          ratio: total === 0 ? 0 : value.amount / total,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  },
});

export const trend = query({
  args: {
    ledgerId: v.id("ledgers"),
    from: v.number(),
    to: v.number(),
    granularity: granularityValidator,
  },
  handler: async (ctx, args) => {
    await requireLedgerOwner(ctx, args.ledgerId);
    assertTimestamp(args.from, "from");
    assertTimestamp(args.to, "to");
    if (args.from > args.to) {
      throw new ConvexError("from must be less than or equal to to");
    }

    const docs = await ctx.db
      .query("transactions")
      .withIndex("by_ledger_occurredAt", (q) =>
        q.eq("ledgerId", args.ledgerId).gte("occurredAt", args.from).lte("occurredAt", args.to),
      )
      .collect();

    const buckets = new Map<string, { income: number; expense: number }>();
    for (const doc of docs) {
      const key = getBucketKey(doc.occurredAt, args.granularity);
      const prev = buckets.get(key) ?? { income: 0, expense: 0 };
      if (doc.type === "income") {
        prev.income += doc.amount;
      } else if (doc.type === "expense") {
        prev.expense += doc.amount;
      }
      buckets.set(key, prev);
    }

    return Array.from(buckets.entries())
      .map(([bucket, value]) => ({
        bucket,
        income: value.income,
        expense: value.expense,
        net: value.income - value.expense,
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  },
});
