import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { sha256 } from "./utils/hash";

export type ResolvedEvent = Doc<"scheduleEvents"> | (Doc<"scheduleEvents"> & {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
});

async function requireDevice(ctx: QueryCtx, token: string) {
  if (!token) throw new Error("No device token");

  const tokenHash = await sha256(token);

  const device = await ctx.db
    .query("devices")
    .withIndex("by_tokenHash", q => q.eq("tokenHash", tokenHash))
    .first();

  if (!device || !device.active) throw new Error("Invalid device");

  return device;
}

// =========================
// PLAYERS
// =========================
export const getPlayerState = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args.token);

    return await ctx.db
      .query("players")
      .withIndex("by_deviceId", q => q.eq("deviceId", device._id))
      .first();
  },
});

export const setPaused = mutation({
  args: { token: v.string(), paused: v.boolean() },
  handler: async (ctx, args) => {
    const device = await requireDevice(ctx, args.token);

    const existing = await ctx.db
      .query("players")
      .withIndex("by_deviceId", q => q.eq("deviceId", device._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        paused: args.paused,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("players", {
        deviceId: device._id,
        paused: args.paused,
        volume: 1,
        updatedAt: Date.now(),
      });
    }
  },
});

// =========================
// PLAYLISTS & SCHEDULES
// =========================
export const getActivePlaylist = query({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<Doc<"selectedPlaylists">[]> => {
    const device = await requireDevice(ctx, args.token);

    return ctx.runQuery(
      internal.playlists.getActivePlaylists,
      { deviceId: device._id }
    );
  },
});

export const getScheduleForDay = query({
  args: { token: v.string(), date: v.number() },
  handler: async (ctx, args): Promise<{
    schedule: Doc<"scheduleGroups"> | null;
    selectedSchedule?: Doc<"selectedSchedules">;
    events: ResolvedEvent[];
  }> => {
    const device = await requireDevice(ctx, args.token);

    return ctx.runQuery(
      internal.schedules.getScheduleForDay,
      { date: args.date }
    );
  },
});

export const getPlaylistById = query({
  args: { token: v.string(), playlistId: v.string() },
  handler: async (ctx, args): Promise<Doc<"playlists">> => {
    const device = await requireDevice(ctx, args.token);

    const playlistId = await ctx.db.normalizeId("playlists", args.playlistId);

    if(!playlistId) throw new Error("Invalid playlistId");

    return ctx.runQuery(
      internal.playlists.getPlaylistById,
      { playlistId }
    );
  },
});

export const getSongsBulk = query({
  args: { token: v.string(), ids: v.array(v.string()) },
  handler: async (ctx, args): Promise<(Doc<"songs"> | null)[]> => {
    const device = await requireDevice(ctx, args.token);

    const ids = args.ids.map(id => ctx.db.normalizeId("songs", id));

    // 🔹 sprawdzenie przed wywołaniem internalQuery
    const existingIds = ids.filter(Boolean) as Id<"songs">[];

    return ctx.runQuery(
      internal.songs.getSongsBulk,
      { ids: existingIds }
    );
  },
});

export const getSongById = query({
  args: { token: v.string(), songId: v.id("songs") },
  handler: async (ctx, args): Promise<Doc<"songs">> => {
    const device = await requireDevice(ctx, args.token);

    return ctx.runQuery(
      internal.songs.getSong,
      { songId: args.songId }
    );
  },
});
