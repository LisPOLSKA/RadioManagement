import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { sha256 } from "./utils/hash";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

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