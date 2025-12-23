import { internalMutation, mutation, query } from "./_generated/server";
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

export const getUsers = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!me || me.role < 2) throw new Error("Forbidden");

    // brak filtra → ostatni users
    if (!args.search) {
      return await ctx.db
        .query("users")
        .order("desc")
        .take(50);
    }

    const search = args.search.toLowerCase();

    // Convex nie ma OR indexów → robimy dwa query
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", q =>
        q.gte("email", search).lte("email", search + "\uffff")
      )
      .take(50);

    const byName = await ctx.db
      .query("users")
      .withIndex("by_displayName", q =>
        q.gte("displayName", search).lte("displayName", search + "\uffff")
      )
      .take(50);

    // deduplikacja
    const map = new Map();
    [...byEmail, ...byName].forEach(u => map.set(u._id, u));

    return Array.from(map.values());
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.number(), // 0 | 1 | 2
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!me || me.role < 2) throw new Error("Forbidden");

    await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
});

export const findUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("users", args.userId);
    if (!id) return undefined;
    const user = await ctx.db.get(id);
    return user ?? undefined;
  },
});