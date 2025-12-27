import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export type ResolvedEvent = Doc<"scheduleEvents"> | (Doc<"scheduleEvents"> & {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
});

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

async function requirePlayerDevice(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
    .first();

  if (!user || user.type !== "player" || !user.deviceId) {
    throw new Error("Forbidden");
  }

  const device = await ctx.db.get(user.deviceId);
  if (!device || !device.active) {
    throw new Error("Device inactive");
  }

  return device;
}

export const getActivePlaylist = query({
  args: {},
  handler: async (ctx): Promise<Doc<"selectedPlaylists">[]> => {
    const device = await requirePlayerDevice(ctx);

    return ctx.runQuery(
      internal.playlists.getActivePlaylists,
      { deviceId: device._id }
    );
  },
});

export const getScheduleForDay = query({
  args: {
    date: v.number(), // timestamp ms
  },
  handler: async (ctx, args): Promise<{
    schedule: Doc<"scheduleGroups"> | null;
    selectedSchedule?: Doc<"selectedSchedules">;
    events: ResolvedEvent[];
  }> => {
    await requirePlayerDevice(ctx);

    return await ctx.runQuery(
      internal.schedules.getScheduleForDay,
      { date: args.date }
    );
  },
});

export const getPlaylistById = query({
  args: {
    playlistId: v.id("playlists"),
  },
  handler: async (ctx, args): Promise<Doc<"playlists">> => {
    await requirePlayerDevice(ctx);

    return await ctx.runQuery(
      internal.playlists.getPlaylistById,
      { playlistId: args.playlistId }
    );
  },
});

export const getSongsBulk = query({
  args: {
    ids: v.array(v.id("songs")),
  },
  handler: async (ctx, args): Promise<(Doc<"songs"> | null)[]> => {
    await requirePlayerDevice(ctx);

    return await ctx.runQuery(
      internal.songs.getSongsBulk,
      { ids: args.ids }
    );
  },
});

export const getSongById = query({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args): Promise<Doc<"songs">> => {
    await requirePlayerDevice(ctx);

    return await ctx.runQuery(
      internal.songs.getSong,
      { songId: args.songId }
    );
  },
});
