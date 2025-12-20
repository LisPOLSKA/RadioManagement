import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: v.number(),
  },
  async handler(ctx, { clerkId, email, displayName, role }) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!existing) {
      await ctx.db.insert("users", {
        clerkId,
        email,
        displayName,
        role,
      });
    } else {
      await ctx.db.patch(existing._id, {
        email,
        displayName,
        role,
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  async handler(ctx, { clerkId }) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .first();

    return user ?? null;
  },
});