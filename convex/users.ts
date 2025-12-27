import { paginationOptsValidator } from "convex/server";
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
        searchKey: displayName.toLowerCase() + email.toLowerCase(),
      });
    } else {
      await ctx.db.patch(existing._id, {
        email,
        displayName,
        role,
        searchKey: displayName.toLowerCase() + email.toLowerCase(),
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
    paginationOpts: paginationOptsValidator,
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
        .paginate(args.paginationOpts);
    }

    const search = args.search.toLowerCase();

    // Convex nie ma OR indexów → robimy dwa query
    
    return ctx.db
      .query("users")
      .withIndex("by_searchKey", q =>
        q.gte("searchKey", search).lte("searchKey", search + "\uffff")
      )
      .paginate(args.paginationOpts);
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.number(), // 0 | 1 | 2 | 3
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!me || me.role < 2) {
      throw new Error("Forbidden");
    }

    // 🚫 nie można zmieniać własnej roli
    if (me._id === args.userId) {
      throw new Error("Cannot change own role");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new Error("User not found");
    }

    // 🚫 admin nie może ruszać adminów ani superadminów
    if (me.role === 2 && target.role >= 2) {
      throw new Error("Forbidden");
    }

    // 🚫 admin nie może nadawać admina ani superadmina
    if (me.role === 2 && args.role >= 2) {
      throw new Error("Forbidden");
    }

    // ✅ opcjonalnie: walidacja zakresu
    if (![0, 1, 2, 3].includes(args.role)) {
      throw new Error("Invalid role");
    }

    if(target.deviceId){
      throw new Error("Cannot change role of device user");
    }

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