import { paginationOptsValidator } from "convex/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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
    searchUserId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!me || me.role < 2) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

    // brak filtra → ostatni users
    if (!args.search && !args.searchUserId) {
      return await ctx.db
        .query("users")
        .order("desc")
        .paginate(args.paginationOpts);
    }
    if (args.searchUserId) {
      const id = ctx.db.normalizeId("users", args.searchUserId);
      if (!id) {
        return await ctx.db
          .query("users")
          .order("desc")
          .paginate(args.paginationOpts);
      }else {
        const user = await ctx.db.query("users").withIndex("by_id", q => q.eq("_id", id)).paginate(args.paginationOpts);
        if(!user){
          return await ctx.db.query("users").order("desc").paginate(args.paginationOpts);
        }
        return user;
      }
    }

    if(!args.search){
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
    role: v.number(), // 0 | 1 | 2 | 3 | 4
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!me || me.role < 3) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    // 🚫 nie można zmieniać własnej roli
    if (me._id === args.userId) {
      throw new ConvexError("CANNOT_CHANGE_OWN_ROLE");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("USER_NOT_FOUND");
    }

    // 🚫 admin nie może ruszać adminów ani superadminów
    if (me.role === 3 && target.role >= 3) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    // 🚫 admin nie może nadawać admina ani superadmina
    if (me.role === 3 && args.role >= 3) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    // ✅ opcjonalnie: walidacja zakresu
    if (![0, 1, 2, 3, 4].includes(args.role)) {
      throw new ConvexError("INVALID_ROLE");
    }

    if(target.deviceId){
      throw new ConvexError("DEVICE_USER_ROLE_CHANGE_FORBIDDEN");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
});

export const setComment = mutation({
  args: {
    userId: v.id("users"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!me || me.role < 3) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    if(me._id === args.userId){
      throw new ConvexError("CANNOT_CHANGE_OWN_COMMENT");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("USER_NOT_FOUND");
    }

    if(target.role >= 3 && me.role < 4){
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    await ctx.db.patch(args.userId, {
      comment: args.comment,
    });

  }
})

export const findUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("users", args.userId);
    if (!id) return undefined;
    const user = await ctx.db.get(id);
    return user ?? undefined;
  },
});