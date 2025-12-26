import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPlayerState = query({
  args: {
    deviceId: v.id("devices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_deviceId", q => q.eq("deviceId", args.deviceId))
      .first();
  },
});

export const setPaused = mutation({
  args: {
    deviceId: v.id("devices"),
    paused: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role < 2) throw new Error("Forbidden");

    const existing = await ctx.db
      .query("players")
      .withIndex("by_deviceId", q => q.eq("deviceId", args.deviceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        paused: args.paused,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("players", {
        deviceId: args.deviceId,
        paused: args.paused,
        volume: 1,
        updatedAt: Date.now(),
      });
    }
  },
});
