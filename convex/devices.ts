import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { sha256 } from "./utils/hash";

export const registerDevice = mutation({
  args: {
    name: v.string(),
    token: v.string(),
  },
  handler: async (ctx, { name, token }) => {
    const tokenHash = await sha256(token);

    return ctx.db.insert("devices", {
      name,
      tokenHash,
      active: true,
      createdAt: Date.now(),
    });
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