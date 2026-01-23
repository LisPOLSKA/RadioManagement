import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const logAdminAction = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { userId, action, targetTable, targetId, details }) => {
    await ctx.db.insert("logs", {
      createdBy: userId,
      action,
      targetTable,
      targetId,
      details,
      createdAt: Date.now(),
    });
  },
});

export const getLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.id("users")),
    action: v.optional(v.string()),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role < 3) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    // 1️⃣ userId + action (najmocniejszy indeks)
    if (args.userId && args.action) {
      const page = await ctx.db
        .query("logs")
        .withIndex("by_createdBy_action", q =>
          q.eq("createdBy", args.userId!).eq("action", args.action!)
        )
        .order("desc")
        .paginate(args.paginationOpts);

      return {
        ...page,
        page: page.page.filter(l =>
          (!args.targetTable || l.targetTable === args.targetTable) &&
          (!args.targetId || l.targetId === args.targetId)
        ),
      };
    }

    // 2️⃣ userId
    if (args.userId) {
      const page = await ctx.db
        .query("logs")
        .withIndex("by_createdBy", q => q.eq("createdBy", args.userId!))
        .order("desc")
        .paginate(args.paginationOpts);

      return {
        ...page,
        page: page.page.filter(l =>
          (!args.action || l.action === args.action) &&
          (!args.targetTable || l.targetTable === args.targetTable) &&
          (!args.targetId || l.targetId === args.targetId)
        ),
      };
    }

    // 3️⃣ action
    if (args.action) {
      const page = await ctx.db
        .query("logs")
        .withIndex("by_action", q => q.eq("action", args.action!))
        .order("desc")
        .paginate(args.paginationOpts);

      return {
        ...page,
        page: page.page.filter(l =>
          (!args.userId || l.createdBy === args.userId) &&
          (!args.targetTable || l.targetTable === args.targetTable) &&
          (!args.targetId || l.targetId === args.targetId)
        ),
      };
    }

    // 4️⃣ targetTable + targetId
    if (args.targetTable && args.targetId) {
      const page = await ctx.db
        .query("logs")
        .withIndex("by_targetTable_targetId", q =>
          q.eq("targetTable", args.targetTable).eq("targetId", args.targetId)
        )
        .order("desc")
        .paginate(args.paginationOpts);

      return {
        ...page,
        page: page.page.filter(l =>
          (!args.userId || l.createdBy === args.userId) &&
          (!args.action || l.action === args.action)
        ),
      };
    }

    // 5️⃣ tylko targetTable
    if (args.targetTable) {
      const page = await ctx.db
        .query("logs")
        .withIndex("by_targetTable", q => q.eq("targetTable", args.targetTable))
        .order("desc")
        .paginate(args.paginationOpts);

      return {
        ...page,
        page: page.page.filter(l =>
          (!args.userId || l.createdBy === args.userId) &&
          (!args.action || l.action === args.action) &&
          (!args.targetId || l.targetId === args.targetId)
        ),
      };
    }

    // 6️⃣ brak filtrów
    const page = await ctx.db
      .query("logs")
      .withIndex("by_createdAt", q => q.gte("createdAt", 0))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...page,
      page: page.page.filter(l =>
        (!args.userId || l.createdBy === args.userId) &&
        (!args.action || l.action === args.action) &&
        (!args.targetTable || l.targetTable === args.targetTable) &&
        (!args.targetId || l.targetId === args.targetId)
      ),
    };
  },
});
