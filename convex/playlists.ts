import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek"
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

dayjs.tz.setDefault("Europe/Warsaw");

export const upsertPlaylist = mutation({
    args: {
        playlistId: v.optional(v.id("playlists")), // opcjonalne do edycji
        title: v.string(),
        songs: v.array(v.id("songs")),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("UNAUTHENTICATED");

        const id = await getAuthUserId(ctx);
        if(!id) throw new ConvexError("UNAUTHENTICATED");
        const user = await ctx.db.get(id);
        

        if (!user || user.role <= 0) {
            throw new ConvexError("INSUFFICIENT_PERMISSIONS");
        }

        if (!args.songs || args.songs.length === 0) {
            throw new ConvexError("PLAYLIST_EMPTY");
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
          if (!playlist) throw new ConvexError("PLAYLIST_NOT_FOUND")

          const isOwner = user._id === playlist.createdBy;
          const isAdmin = user.role >= 2;

          if (!isOwner && !isAdmin) {
              throw new ConvexError("INSUFFICIENT_PERMISSIONS");
          }

          await ctx.db.patch(args.playlistId, data);

          await ctx.runMutation(internal.logs.logAdminAction, {
              userId: user._id,
              action: "UPDATE_PLAYLIST",
              targetTable: "playlists",
              targetId: args.playlistId,
              details: JSON.stringify(data),
          });
        } else {
          // ➕ CREATE
          const id = await ctx.db.insert("playlists", data);

          await ctx.runMutation(internal.logs.logAdminAction, {
              userId: user._id,
              action: "CREATE_PLAYLIST",
              targetTable: "playlists",
              targetId: id,
              details: JSON.stringify(data),
          });
        }
    },
});


export const deletePlaylist = mutation({
    args: {
        playlistId: v.id("playlists"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("UNAUTHENTICATED");;

        const id = await getAuthUserId(ctx);
        if(!id) throw new ConvexError("UNAUTHENTICATED");
        const user = await ctx.db.get(id);
    

        if (!user || user.role <= 0) {
            throw new ConvexError("INSUFFICIENT_PERMISSIONS");
        }

        const playlist = await ctx.db.get(args.playlistId);
        if (!playlist) throw new ConvexError("PLAYLIST_NOT_FOUND");
        const isOwner = user._id === playlist.createdBy;
        const isAdmin = user.role >= 2;

        if (!isOwner && !isAdmin) {
            throw new ConvexError("INSUFFICIENT_PERMISSIONS");
        }

        await ctx.db.delete(args.playlistId);

        await ctx.runMutation(internal.logs.logAdminAction, {
            userId: user._id,
            action: "DELETE_PLAYLIST",
            targetTable: "playlists",
            targetId: args.playlistId,
        });
    },
});

  export const clonePlaylist = mutation({
    args: {
      playlistId: v.id("playlists"),
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new ConvexError("UNAUTHENTICATED");

      const id = await getAuthUserId(ctx);
      if (!id) throw new ConvexError("UNAUTHENTICATED");
      const user = await ctx.db.get(id);

      if (!user || user.role <= 0) {
        throw new ConvexError("INSUFFICIENT_PERMISSIONS");
      }

      const playlist = await ctx.db.get(args.playlistId);
      if (!playlist) throw new ConvexError("PLAYLIST_NOT_FOUND");

      const clonedData = {
        title: `${playlist.title} (copy)`,
        songs: playlist.songs,
        description: playlist.description,
        createdBy: user._id,
      };

      const clonedPlaylistId = await ctx.db.insert("playlists", clonedData);
      const clonedPlaylist = await ctx.db.get(clonedPlaylistId);
      if (!clonedPlaylist) throw new ConvexError("PLAYLIST_NOT_FOUND");

      await ctx.runMutation(internal.logs.logAdminAction, {
        userId: user._id,
        action: "CLONE_PLAYLIST",
        targetTable: "playlists",
        targetId: clonedPlaylistId,
        details: JSON.stringify({
          sourcePlaylistId: args.playlistId,
          ...clonedData,
        }),
      });

      return clonedPlaylist;
    },
  });

export const importPlaylistFromYoutube = internalMutation({
  args: {
    apiTokenHash: v.string(),
    category: v.string(),
    playlist: v.object({
      sourcePlaylistId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      author: v.optional(v.string()),
      items: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          url: v.string(),
          author: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_apiTokenHash", (q) =>
          q.eq("apiTokenHash", args.apiTokenHash)
        )
        .unique();

      if (!user) throw new ConvexError("UNAUTHORIZED");
      if ( user.role < 1 ) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

      const now = Date.now();
      if (user.lastRequestAt && now - user.lastRequestAt < 60000) {
        throw new ConvexError("REQUEST_TOO_FREQUENT");
      }

      const youtubePlaylist = args.playlist;

      if (!youtubePlaylist.items.length) {
        throw new ConvexError("PLAYLIST_EMPTY");
      }

      const importedSongs: Id<"songs">[] = [];

      for (const item of youtubePlaylist.items) {
        const existingSong = await ctx.db
          .query("songs")
          .withIndex("by_ytLink", (q) => q.eq("ytLink", item.url))
          .first();

        if (existingSong) {
          await ctx.db.patch(existingSong._id, {
            title: item.title.trim() || item.id,
            artist: item.author || youtubePlaylist.author || "Unknown",
            category: args.category,
            searchKey: `${item.title} ${item.author || youtubePlaylist.author || "Unknown"} ${args.category} ${item.url}`,
          });

          await ctx.runMutation(internal.logs.logAdminAction, {
            userId: user._id,
            action: "UPDATE_SONG",
            targetTable: "songs",
            targetId: existingSong._id,
            details: JSON.stringify({
              title: item.title.trim() || item.id,
              artist: item.author || youtubePlaylist.author || "Unknown",
              category: args.category,
              ytLink: item.url,
            }),
          });

          importedSongs.push(existingSong._id);
          continue;
        }

        const songData = {
          title: item.title.trim() || item.id,
          artist: item.author || youtubePlaylist.author || "Unknown",
          category: args.category,
          ytLink: item.url,
          createdBy: user._id,
          searchKey: `${item.title} ${item.author || youtubePlaylist.author || "Unknown"} ${args.category} ${item.url}`,
        };

        const songId = await ctx.db.insert("songs", songData);
        importedSongs.push(songId);

        await ctx.runMutation(internal.logs.logAdminAction, {
          userId: user._id,
          action: "CREATE_SONG",
          targetTable: "songs",
          targetId: songId,
          details: JSON.stringify(songData),
        });
      }

      const playlistData = {
        title: youtubePlaylist.title || "Imported playlist",
        songs: importedSongs,
        description: youtubePlaylist.description || undefined,
        sourcePlaylistId: youtubePlaylist.sourcePlaylistId,
        createdBy: user._id,
      };

      const existingPlaylist = await ctx.db
        .query("playlists")
        .withIndex("by_createdBy_sourcePlaylistId", (q) =>
          q.eq("createdBy", user._id).eq("sourcePlaylistId", youtubePlaylist.sourcePlaylistId)
        )
        .first();

      let playlistId: Id<"playlists">;
      let playlist: Doc<"playlists"> | null | undefined;

      if (existingPlaylist) {
        playlistId = existingPlaylist._id;
        await ctx.db.patch(existingPlaylist._id, playlistData);
        playlist = await ctx.db.get(existingPlaylist._id);

        await ctx.runMutation(internal.logs.logAdminAction, {
          userId: user._id,
          action: "UPDATE_PLAYLIST",
          targetTable: "playlists",
          targetId: existingPlaylist._id,
          details: JSON.stringify({
            source: youtubePlaylist.title,
            importedSongs: importedSongs.length,
            ...playlistData,
          }),
        });
      } else {
        playlistId = await ctx.db.insert("playlists", playlistData);
        playlist = await ctx.db.get(playlistId);

        await ctx.runMutation(internal.logs.logAdminAction, {
          userId: user._id,
          action: "CREATE_PLAYLIST",
          targetTable: "playlists",
          targetId: playlistId,
          details: JSON.stringify({
            source: youtubePlaylist.title,
            importedSongs: importedSongs.length,
            ...playlistData,
          }),
        });
      }

      await ctx.db.patch(user._id, {
        lastRequestAt: now
      });

      return playlist;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      console.error("Failed to import YouTube playlist", error);
      throw new ConvexError("PLAYLIST_NOT_FOUND");
    }
  },
});

export const getPlaylists = query({
  args: {
    title: v.optional(v.string()),
    isMine: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const id = await getAuthUserId(ctx);
    if(!id) throw new ConvexError("UNAUTHENTICATED");
    const user = await ctx.db.get(id);

    if (!user || user.role <= 0) throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    let q;

    if (args.title && args.isMine) {
      // filtr po tytule i autorze
      q = ctx.db
        .query("playlists")
        .withSearchIndex("search_by_title_createdBy", q => q.search("title", args.title!).eq("createdBy", user._id))
    } else if (args.title) {
      q = ctx.db.query("playlists").withSearchIndex("search_by_title_createdBy", q => q.search("title", args.title!));
    } else if (args.isMine) {
      q = ctx.db.query("playlists").withIndex("by_createdBy", q => q.eq("createdBy", user._id));
    } else {
      q = ctx.db.query("playlists");
    }

    return q.paginate(args.paginationOpts);
  },
});



export const getActivePlaylists = internalQuery({
  args: {
    deviceId: v.id("devices"),
  },
  handler: async (ctx) => {
    const now = dayjs.tz(Date.now(), "Europe/Warsaw");

    // 🟢 NORMALIZACJA DNIA (CET)
    const dayStart = now.clone()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);

    const dayEnd = now.clone()
      .hour(23)
      .minute(59)
      .second(59)
      .millisecond(999);

    const dayStartTs = dayStart.valueOf();
    const dayEndTs = dayEnd.valueOf();

    // 🟢 PONIEDZIAŁEK = 0
    // isoWeekday(): 1 = Mon ... 7 = Sun
    const today = now.isoWeekday() - 1;

    // 🟢 INDEX: endDate >= start dnia
    const playlists = await ctx.db
      .query("selectedPlaylists")
      .withIndex("by_endDate", q => q.gte("endDate", dayStartTs))
      .collect();

    const activePlaylists = playlists
      .filter(pl => {
        // 📅 zakres dni
        if (pl.startDate && pl.startDate > dayEndTs) return false;
        if (pl.endDate && pl.endDate < dayStartTs) return false;

        // 📆 dni tygodnia
        if (pl.schedule && !pl.schedule.includes(today)) return false;

        return true;
      })
      .sort((a, b) => b.priority - a.priority);

    return activePlaylists.length > 0
      ? [activePlaylists[0]]
      : [];
  },
});

export const getActivePlaylistForTime = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const now = dayjs.tz(args.date, "Europe/Warsaw");

    // 🟢 NORMALIZACJA DNIA (CET)
    const dayStart = now.clone()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);

    const dayEnd = now.clone()
      .hour(23)
      .minute(59)
      .second(59)
      .millisecond(999);

    const dayStartTs = dayStart.valueOf();
    const dayEndTs = dayEnd.valueOf();

    // 🟢 PONIEDZIAŁEK = 0
    // isoWeekday(): 1 = Mon ... 7 = Sun
    const today = now.isoWeekday() - 1;

    // 🟢 INDEX: endDate >= start dnia
    const playlists = await ctx.db
      .query("selectedPlaylists")
      .withIndex("by_endDate", q => q.gte("endDate", dayStartTs))
      .collect();

    const activePlaylists = playlists
      .filter(pl => {
        // 📅 zakres dni
        if (pl.startDate && pl.startDate > dayEndTs) return false;
        if (pl.endDate && pl.endDate < dayStartTs) return false;

        // 📆 dni tygodnia
        if (pl.schedule && !pl.schedule.includes(today)) return false;

        return true;
      })
      .sort((a, b) => b.priority - a.priority);

    return activePlaylists.length > 0
      ? [activePlaylists[0]]
      : [];
  },
});

export const getPublicPlaylistById = query({
  args: {
    playlistsId: v.array(v.id("playlists")),
  },
  handler: async (ctx, args) => {
    const playlists = await Promise.all(args.playlistsId.map(async (id) => {
      const playlistId = await ctx.db.normalizeId("playlists", id);
      
      if(!playlistId) return null;
      const playlist = await ctx.db.get(playlistId);

      if (!playlist) return null;

      return playlist;
    }))
    return playlists.filter(p => p !== null);
  },
});

export const upsertSelectedPlaylist = mutation({
  args: {
    selectedPlaylistId: v.optional(v.id("selectedPlaylists")),
    playlistId: v.array(v.id("playlists")),
    priority: v.number(),
    schedule: v.optional(v.array(v.number())), // dni tygodnia 0-6
    startDate: v.number(), // timestamp ms
    endDate: v.number(),   // timestamp ms
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const id = await getAuthUserId(ctx);
    if(!id) throw new ConvexError("UNAUTHENTICATED");
    const user = await ctx.db.get(id);

    if (!user || user.role < 2) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

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
      if (!existing) throw new ConvexError("SELECTED_PLAYLIST_NOT_FOUND");

      if (existing.createdBy !== user._id && user.role < 2) {
        throw new ConvexError("INSUFFICIENT_PERMISSIONS");
      }

      await ctx.db.patch(args.selectedPlaylistId, data);

      await ctx.runMutation(internal.logs.logAdminAction, {
        userId: user._id,
        action: "UPDATE_SELECTED_PLAYLIST",
        targetTable: "selectedPlaylists",
        targetId: args.selectedPlaylistId,
        details: JSON.stringify(data),
      });
    } else {
      // Tworzenie nowego
      const id = await ctx.db.insert("selectedPlaylists", data);

      await ctx.runMutation(internal.logs.logAdminAction, {
        userId: user._id,
        action: "CREATE_SELECTED_PLAYLIST",
        targetTable: "selectedPlaylists",
        targetId: id,
        details: JSON.stringify(data),
      });
    }
  },
});

export const deleteSelectedPlaylist = mutation({
  args: { selectedPlaylistId: v.id("selectedPlaylists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const id = await getAuthUserId(ctx);
    if(!id) throw new ConvexError("UNAUTHENTICATED");
    const user = await ctx.db.get(id);

    if (!user || user.role < 2) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

    const existing = await ctx.db.get(args.selectedPlaylistId);
    if (!existing) throw new ConvexError("SELECTED_PLAYLIST_NOT_FOUND");

    if (existing.createdBy !== user._id && user.role < 2) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    await ctx.db.delete(args.selectedPlaylistId);

    await ctx.runMutation(internal.logs.logAdminAction, {
      userId: user._id,
      action: "DELETE_SELECTED_PLAYLIST",
      targetTable: "selectedPlaylists",
      targetId: args.selectedPlaylistId,
    });
  },
});

export const getSelectedPlaylists = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const id = await getAuthUserId(ctx);
    if(!id) throw new ConvexError("UNAUTHENTICATED");
    const user = await ctx.db.get(id);

    if (!user || user.role <= 0) throw new ConvexError("INSUFFICIENT_PERMISSIONS");

    const playlistsPage = await ctx.db
      .query("selectedPlaylists")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Dopinanie playlistName
    const resultsWithNames = await Promise.all(
        playlistsPage.page.map(async (sp) => {
            const playlist = await ctx.db.get(sp.playlistId[0]);
            return {
            ...sp,
            playlistName: sp.playlistId.length > 1 ? ((playlist?.title || "Unknown") + " And more") : playlist?.title || "Unknown",
            };
        })
    );

    return {
        ...playlistsPage,
        page: resultsWithNames,
    };
  },
});

export const getPlaylistById = internalQuery({
  args: {
    playlistId: v.id("playlists"),
  },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");

    return playlist;
  },
});