import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { sha256 } from "./utils/hash";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";

export const registerDevice = mutation({
  args: {
    name: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { name, token }) => {
    const tokenHash = await sha256(token);

    const deviceId = await ctx.db.insert("devices", {
      name,
      tokenHash,
      active: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("players", {
      deviceId,
      paused: false,
      volume: 100,
      updatedAt: Date.now(),
    });

    const userId = await getAuthUserId(ctx);

    await ctx.runMutation(internal.logs.logAdminAction, {
      userId: userId || undefined,
      action: "REGISTER_DEVICE",
      targetTable: "devices",
      targetId: deviceId,
    });

    return deviceId;
  },
});

export const getByTokenHash = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    return ctx.db
      .query("devices")
      .withIndex("by_tokenHash", q => q.eq("tokenHash", tokenHash))
      .unique();
  },
});

export const updateLastSeenAt = internalMutation({
  args: {
    deviceId: v.id("devices"),
    lastSeenAt: v.number(),
  },
  handler: async (ctx, { deviceId, lastSeenAt }) => {
    await ctx.db.patch(deviceId, { lastSeenAt });
    return true;
  },
});

export const getDevices = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const id = await getAuthUserId(ctx);
    if (!id) throw new ConvexError("UNAUTHENTICATED");
    const user = await ctx.db.get(id);

    if (!user || user.role < 3) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

    return ctx.db.query("devices").order("desc").paginate(args.paginationOpts);
  },
});

export const deleteDevice = mutation({
  args: {
    deviceId: v.id("devices"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const id = await getAuthUserId(ctx);
    if (!id) throw new ConvexError("UNAUTHENTICATED");
    const user = await ctx.db.get(id);

    if (!user || user.role < 3) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new ConvexError("DEVICE_NOT_FOUND");

    // Delete associated player state
    const player = await ctx.db
      .query("players")
      .filter(q => q.eq(q.field("deviceId"), args.deviceId))
      .unique();
    
    if (player) {
      await ctx.db.delete(player._id);
    }

    // Delete device
    await ctx.db.delete(args.deviceId);

    await ctx.runMutation(internal.logs.logAdminAction, {
      userId: user._id,
      action: "DELETE_DEVICE",
      targetTable: "devices",
      targetId: args.deviceId,
    });

    return true;
  },
});