import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

export const upsertException = mutation({
  args: {
    exceptionId: v.optional(v.id("exceptions")),
    groupId: v.id("scheduleGroups"),
    eventId: v.optional(v.id("scheduleEvents")),
    action: v.union(v.literal("SKIP_DAY"), v.literal("SKIP_EVENT"), v.literal("MODIFY_EVENT")),
    priority: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.number(),
    dayOfWeek: v.array(v.number()), // 0-6
    startHour: v.optional(v.number()),
    startMinute: v.optional(v.number()),
    endHour: v.optional(v.number()),
    endMinute: v.optional(v.number()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role < 2) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    // Walidacja godzin
    if (
      args.startHour !== undefined && (args.startHour < 0 || args.startHour > 23) ||
      args.endHour !== undefined && (args.endHour < 0 || args.endHour > 23) ||
      args.startMinute !== undefined && (args.startMinute < 0 || args.startMinute > 59) ||
      args.endMinute !== undefined && (args.endMinute < 0 || args.endMinute > 59)
    ) {
      throw new ConvexError("INVALID_TIME");
    }

    if (args.action === "MODIFY_EVENT") {
        if (args.startHour !== undefined && args.endHour !== undefined &&
            args.startMinute !== undefined && args.endMinute !== undefined) 
            {
            const startTotal = args.startHour * 60 + args.startMinute;
            const endTotal = args.endHour * 60 + args.endMinute;
            if (startTotal >= endTotal) {
              throw new ConvexError("INVALID_EVENT_RANGE");
            }
        }
    }

    const { exceptionId, ...data } = args;

    if (args.exceptionId) {
      const existing = await ctx.db.get(args.exceptionId);
      if (!existing) throw new ConvexError("NOT_FOUND");

      await ctx.db.patch(args.exceptionId, {
        ...data,
      });

      await ctx.runMutation(internal.logs.logAdminAction, {
        userId: user._id,
        action: "UPDATE_EXCEPTION",
        targetTable: "exceptions",
        targetId: args.exceptionId,
        details: JSON.stringify(data),
      });

      return args.exceptionId;
    } else {
      const newId = await ctx.db.insert("exceptions", {
        ...data,
        createdBy: user._id
      });

      await ctx.runMutation(internal.logs.logAdminAction, {
        userId: user._id,
        action: "CREATE_EXCEPTION",
        targetTable: "exceptions",
        targetId: newId,
        details: JSON.stringify(data),
      });

      return newId;
    }
  }
});

export const deleteException = mutation({
  args: {
    exceptionId: v.id("exceptions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role < 2) throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    const canManageAllContent = user.role >= 2;

    const existing = await ctx.db.get(args.exceptionId);
    if (!existing) throw new ConvexError("NOT_FOUND");
    if (!canManageAllContent && existing.createdBy !== user._id) throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    await ctx.db.delete(args.exceptionId);

    await ctx.runMutation(internal.logs.logAdminAction, {
        userId: user._id,
        action: "DELETE_EXCEPTION",
        targetTable: "exceptions",
        targetId: args.exceptionId,
    });
  }
});

export const getExceptions = query({
  args: {
    groupId: v.optional(v.id("scheduleGroups")),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role <= 0)  throw new ConvexError("INSUFFICIENT_PERMISSIONS");

    let q;

    if (args.groupId) {
        q = ctx.db.query("exceptions").withIndex("by_groupId", q => q.eq("groupId", args.groupId!));
    }else{
        q = ctx.db.query("exceptions");
    }

    return q.order("desc").paginate(args.paginationOpts);
  }
});
