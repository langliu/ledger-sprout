import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAuthUser } from "./lib/auth";

const DEFAULT_LEDGER_NAME = "默认账本";

const DEFAULT_EXPENSE_CATEGORIES = [
  "餐饮",
  "交通",
  "住房",
  "购物",
  "娱乐",
] as const;

const DEFAULT_INCOME_CATEGORIES = ["工资", "奖金", "兼职", "其他收入"] as const;

async function createDefaultCategories(
  ctx: MutationCtx,
  ledgerId: Id<"ledgers">,
  now: number,
) {
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await ctx.db.insert("categories", {
      ledgerId,
      name,
      type: "expense",
      isSystem: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }
  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await ctx.db.insert("categories", {
      ledgerId,
      name,
      type: "income",
      isSystem: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx);
    return await ctx.db
      .query("ledgers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const ensureDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx);

    const existing = await ctx.db
      .query("ledgers")
      .withIndex("by_user_default", (q) =>
        q.eq("userId", user._id).eq("isDefault", true),
      )
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const ledgerId = await ctx.db.insert("ledgers", {
      userId: user._id,
      name: DEFAULT_LEDGER_NAME,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    await createDefaultCategories(ctx, ledgerId, now);

    const ledger = await ctx.db.get(ledgerId);
    if (!ledger) {
      throw new ConvexError("Failed to create default ledger");
    }
    return ledger;
  },
});

export const rename = mutation({
  args: {
    ledgerId: v.id("ledgers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const ledger = await ctx.db.get(args.ledgerId);
    if (!ledger) {
      throw new ConvexError("Ledger not found");
    }
    if (ledger.userId !== user._id) {
      throw new ConvexError("Forbidden");
    }

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError("name cannot be empty");
    }

    const updatedAt = Date.now();
    await ctx.db.patch(args.ledgerId, { name, updatedAt });
    return await ctx.db.get(args.ledgerId);
  },
});
