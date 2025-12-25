import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

export const upsertSong = mutation({
    args: {
        songId: v.optional(v.id("songs")),
        title: v.string(),
        artist: v.string(),
        category: v.string(),
        spotifyLink: v.string(),
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

        const data = {
            title: args.title,
            artist: args.artist,
            category: args.category,
            spotifyLink: args.spotifyLink,
            createdBy: user._id,
        };

        if (args.songId) {
            // ✏️ EDIT
            const existingSong = await ctx.db.get(args.songId);
            if (!existingSong) throw new Error("Song not found");

            const isOwner = user._id === existingSong.createdBy;
            const isAdmin = user.role >= 2;

            if (!isOwner && !isAdmin) {
                throw new Error("Forbidden");
            }

            await ctx.db.patch(args.songId, data);

            await ctx.runMutation(internal.logs.logAdminAction, {
              userId: user._id,
              action: "UPDATE_SONG",
              targetTable: "songs",
              targetId: args.songId,
              details: JSON.stringify(data),
            });
        } else {
        // ➕ CREATE
            const song  = await ctx.db.query("songs").withIndex("by_spotifyLink", q => q.eq("spotifyLink", args.spotifyLink)).first();
            if (song) {
                throw new Error("Song already exists");
            }
            const id = await ctx.db.insert("songs", data);

            await ctx.runMutation(internal.logs.logAdminAction, {
              userId: user._id,
              action: "CREATE_SONG",
              targetTable: "songs",
              targetId: id,
              details: JSON.stringify(data),
            });
        }
    },
});

export const getSongs = query({
  args: {
    artist: v.optional(v.string()),
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let q;

    if (args.category && args.artist) {
      // 👉 compound index (NAJLEPSZE)
      q = ctx.db
        .query("songs")
        .withIndex("by_category_artist", (q) =>
          q.eq("category", args.category!)
           .eq("artist", args.artist!)
        );
    } else if (args.category) {
      q = ctx.db
        .query("songs")
        .withIndex("by_category", (q) =>
          q.eq("category", args.category!)
        );
    } else if (args.artist) {
      q = ctx.db
        .query("songs")
        .withIndex("by_artist", (q) =>
          q.eq("artist", args.artist!)
        );
    } else {
      q = ctx.db.query("songs");
    }

    return q.order("desc").paginate(args.paginationOpts);
  },
});


export const deleteSong = mutation({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Pobranie użytkownika i sprawdzenie uprawnień
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role <= 0) {
      throw new Error("Forbidden");
    }

    // Pobranie utworu
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error("Song not found");

    const isOwner = user._id === song.createdBy;
    const isAdmin = user.role >= 2;

    if (!isOwner && !isAdmin) {
      throw new Error("Forbidden");
    }

    // Usuwanie piosenki
    await ctx.db.delete(args.songId);

    await ctx.runMutation(internal.logs.logAdminAction, {
      userId: user._id,
      action: "DELETE_SONG",
      targetTable: "songs",
      targetId: args.songId,
    });
  },
});

export const getSong = internalQuery({
  args: {
    songId: v.id("songs"),
  },
  handler: async (ctx, args) => {
    const song = await ctx.db.get(args.songId);
    if (!song) throw new Error("Song not found");

    return song;
  },
});

export const getSongsBulk = internalQuery({
  args: {
    ids: v.array(v.id("songs")),
  },
  handler: async (ctx, args) => {
    const songs = await Promise.all(args.ids.map(id => ctx.db.get(id)));
    // Filtrujemy null-e w razie brakujących
    return songs.filter(Boolean);
  },
});