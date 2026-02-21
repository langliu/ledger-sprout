import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../betterAuth/auth";

type AppCtx = QueryCtx | MutationCtx;

export async function requireAuthUser(ctx: AppCtx) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Unauthenticated");
  }
  return user;
}

export async function requireLedgerOwner(ctx: AppCtx, ledgerId: Id<"ledgers">) {
  const user = await requireAuthUser(ctx);
  const ledger = await ctx.db.get(ledgerId);
  if (!ledger) {
    throw new ConvexError("Ledger not found");
  }
  if (ledger.userId !== user._id) {
    throw new ConvexError("Forbidden");
  }
  return { user, ledger };
}
