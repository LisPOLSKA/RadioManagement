import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const upsertPlaylist = mutation({
    args: {
        playlistId: v.optional(v.id("playlists")), // opcjonalne do edycji
        title: v.string(),
        songs: v.array(v.id("songs")),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role <= 0) {
            throw new Error("Forbidden");
        }

        if (!args.songs || args.songs.length === 0) {
            throw new Error("Playlist must contain at least one song");
        }

        const data = {
            title: args.title,
            songs: args.songs,
            description: args.description,
            createdBy: user._id,
        };

        if (args.playlistId) {
            // ✏️ EDIT: tylko właściciel lub admin
            const playlist = await ctx.db.get(args.playlistId);
            if (!playlist) throw new Error("Playlist not found");

            const isOwner = user._id === playlist.createdBy;
            const isAdmin = user.role >= 2;

            if (!isOwner && !isAdmin) {
                throw new Error("Forbidden");
            }

            await ctx.db.patch(args.playlistId, data);
        } else {
            // ➕ CREATE
            await ctx.db.insert("playlists", data);
        }
    },
});


export const deletePlaylist = mutation({
    args: {
        playlistId: v.id("playlists"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role <= 0) {
            throw new Error("Forbidden");
        }

        const playlist = await ctx.db.get(args.playlistId);
        if (!playlist) throw new Error("Playlist not found");

        const isOwner = user._id === playlist.createdBy;
        const isAdmin = user.role >= 2;

        if (!isOwner && !isAdmin) {
            throw new Error("Forbidden");
        }

        await ctx.db.delete(args.playlistId);
    },
});

export const getPlaylists = query({
  args: {
    title: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let q;

    if (args.title && args.createdBy) {
      // filtr po tytule i autorze
      q = ctx.db
        .query("playlists")
        .filter((p) => p.eq(p.field("title"), args.title))
        .filter((p) => p.eq(p.field("createdBy"), args.createdBy));
    } else if (args.title) {
      q = ctx.db.query("playlists").filter((p) => p.eq(p.field("title"), args.title));
    } else if (args.createdBy) {
      q = ctx.db.query("playlists").filter((p) => p.eq(p.field("createdBy"), args.createdBy));
    } else {
      q = ctx.db.query("playlists");
    }

    return q.order("desc").paginate(args.paginationOpts);
  },
});



export const getActivePlaylists = query({
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date().getDay();

    // Pobieramy playlisty, które mają startDate <= now i endDate >= now
    const playlists = await ctx.db
      .query("selectedPlaylists")
      .withIndex("by_active_period", (q) =>
        q
          .lte("startDate", now)
          .gte("endDate", now)
      )
      .collect();

    // Filtrowanie po dniu tygodnia i sortowanie po priorytecie
    const activePlaylists = playlists
      .filter(pl => !pl.schedule || pl.schedule.includes(today))
      .sort((a, b) => b.priority - a.priority);

    return activePlaylists[0] ? [activePlaylists[0]] : [];
  },
});

export const upsertSelectedPlaylist = mutation({
  args: {
    selectedPlaylistId: v.optional(v.id("selectedPlaylists")),
    playlistId: v.id("playlists"),
    priority: v.number(),
    schedule: v.optional(v.array(v.number())), // dni tygodnia 0-6
    startDate: v.optional(v.number()), // timestamp ms
    endDate: v.optional(v.number()),   // timestamp ms
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role <= 0) throw new Error("Forbidden");

    const data = {
      playlistId: args.playlistId,
      priority: args.priority,
      schedule: args.schedule,
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: user._id,
    };

    if (args.selectedPlaylistId) {
      // Edycja – sprawdzamy czy user ma prawa
      const existing = await ctx.db.get(args.selectedPlaylistId);
      if (!existing) throw new Error("Selected playlist not found");

      if (existing.createdBy !== user._id && user.role < 2) {
        throw new Error("Forbidden: not allowed to edit this playlist");
      }

      await ctx.db.patch(args.selectedPlaylistId, data);
    } else {
      // Tworzenie nowego
      await ctx.db.insert("selectedPlaylists", data);
    }
  },
});

export const deleteSelectedPlaylist = mutation({
  args: { selectedPlaylistId: v.id("selectedPlaylists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role <= 0) throw new Error("Forbidden");

    const existing = await ctx.db.get(args.selectedPlaylistId);
    if (!existing) throw new Error("Selected playlist not found");

    if (existing.createdBy !== user._id && user.role < 2) {
      throw new Error("Forbidden: not allowed to delete this playlist");
    }

    await ctx.db.delete(args.selectedPlaylistId);
  },
});

export const getSelectedPlaylists = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role <= 0) throw new Error("Forbidden");

    const playlistsPage = await ctx.db
      .query("selectedPlaylists")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Dopinanie playlistName
    const resultsWithNames = await Promise.all(
        playlistsPage.page.map(async (sp) => {
            const playlist = await ctx.db.get(sp.playlistId);
            return {
            ...sp,
            playlistName: playlist?.title || "Unknown",
            };
        })
    );

    return {
        ...playlistsPage,
        page: resultsWithNames,
    };
  },
});