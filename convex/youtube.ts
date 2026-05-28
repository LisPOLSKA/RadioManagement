"use node";

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import ytpl from "ytpl";

export const fetchYoutubePlaylist = action({
  args: {
    playlistUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    let sourcePlaylistId: string;

    try {
      sourcePlaylistId = await ytpl.getPlaylistID(args.playlistUrl);
    } catch {
      throw new ConvexError("INVALID_YOUTUBE_PLAYLIST_URL");
    }

    const playlist = await ytpl(sourcePlaylistId);

    return {
      sourcePlaylistId,
      title: playlist.title,
      description: playlist.description || undefined,
      author: playlist.author?.name || undefined,
      items: playlist.items.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        author: item.author?.name || undefined,
      })),
    };
  },
});