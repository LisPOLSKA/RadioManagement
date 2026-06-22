// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
//import { Webhook } from "svix";
import { requireDeviceFromRequest } from "./utils/requireDevice";
import { auth } from "./auth";

const ERROR_STATUS: Record<string, number> = {
  UNAUTHORIZED: 401,
  INSUFFICIENT_PERMISSIONS: 403,
  PLAYLIST_EMPTY: 422,
  REQUEST_TOO_FREQUENT: 429,
};

const http = httpRouter();

auth.addHttpRoutes(http);

// http.route({
//   path: "/clerk-webhook",
//   method: "POST",
//   handler: httpAction(async (ctx, request) => {
//     const event = await validateRequest(request);
//     if (!event) {
//       return new Response("Error occured", { status: 400 });
//     }

//     switch (event.type) {
//       case "user.created":
//       case "user.updated": {
//         const user = event.data;
//         const email =
//           user.email_addresses?.[0]?.email_address ?? "";

//         await ctx.runMutation(internal.users.upsertFromClerk, {
//           clerkId: user.id,
//           email,
//           displayName: user.username ?? user.first_name ?? email ?? "",
//           role: 0,
//         });
//         break;
//       }

//       case "user.deleted": {
//         const clerkUserId = event.data.id!;
//         await ctx.runMutation(internal.users.deleteFromClerk, {
//           clerkId: clerkUserId,
//         });
//         break;
//       }

//       default:
//         console.log("Ignored Clerk webhook event", event.type);
//     }

//     return new Response(null, { status: 200 });
//   }),
// });


http.route({
  path: "/player/active-playlist",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      // 🔐 AUTH – jedno miejsce prawdy
      const device = await requireDeviceFromRequest(ctx, req);

      // 🎵 BIZNES
      const playlist = await ctx.runQuery(
        internal.playlists.getActivePlaylists,
        { deviceId: device._id }
      );

      return Response.json(playlist);
    } catch (err) {
      console.error(err);
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

http.route({
  path: "/player/schedule-for-day",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      // 🔐 AUTH – device token
      const device = await requireDeviceFromRequest(ctx, req);

      if(!device || !device.active) {
        return new Response("Device is not active", { status: 400 });
      }

      const body = await req.json();
      const date = body?.date;

      if (!date || typeof date !== "number") {
        return new Response("Missing date", { status: 400 });
      }

      // 🗓 BIZNES
      const schedule = await ctx.runQuery(
        internal.schedules.getScheduleForDay,
        { date }
      );

      return Response.json(schedule);
    } catch (err) {
      console.error(err);
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

http.route({
  path: "/player/playlist",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const device = await requireDeviceFromRequest(ctx, req);

      const body = await req.json();
      const playlistId = body?.playlistId;
      if (!playlistId) return new Response("Missing playlistId", { status: 400 });

      const playlist = await ctx.runQuery(
        internal.playlists.getPlaylistById,
        { playlistId }
      );

      return Response.json(playlist);
    } catch (err) {
      console.error(err);
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

// Pobiera pełne dane wielu utworów naraz
http.route({
  path: "/player/songs",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const device = await requireDeviceFromRequest(ctx, req);

      const body = await req.json();
      const songIds = body?.ids;
      if (!Array.isArray(songIds)) return new Response("Missing ids", { status: 400 });

      const songs = await ctx.runQuery(
        internal.songs.getSongsBulk,
        { ids: songIds }
      );

      return Response.json(songs);
    } catch (err) {
      console.error(err);
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

http.route({
  path: "/player/song",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const device = await requireDeviceFromRequest(ctx, req);

      const body = await req.json();
      const songId = body?.id;
      if (!songId) return new Response("Missing id", { status: 400 });

      const song = await ctx.runQuery(
        internal.songs.getSong,
        { songId: songId }
      );

      return Response.json(song);
    } catch (err) {
      console.error(err);
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

http.route({
  path: "/playlists/import-from-youtube",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const authHeader = req.headers.get("Authorization") || "";
      if(!authHeader.startsWith("Bearer ")) {
        return new Response("Missing or invalid Authorization header", { status: 400 });
      }
      const apiToken = authHeader.replace("Bearer ", "");
      const hashArray = await crypto
        .subtle.digest("SHA-256", new TextEncoder().encode(apiToken))
      const hash = hashArray
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      if (!hash || !apiToken) return new Response("Missing apiTokenHash", { status: 400 });

      const result = await ctx.runMutation(
        internal.playlists.importPlaylistFromYoutube,
        { ...body, apiTokenHash: hash }
      );

      return Response.json(result);
    } catch (err: any) {
      const code = err?.data;

      if (code) {
        return Response.json(
          { error: code },
          { status: ERROR_STATUS[code] ?? 400 }
        );
      }

      return new Response("Internal error", { status: 500 });
    }
  }),
});

// async function validateRequest(req: Request): Promise<WebhookEvent | null> {
//   const payloadString = await req.text();
//   const svixHeaders = {
//     "svix-id": req.headers.get("svix-id")!,
//     "svix-timestamp": req.headers.get("svix-timestamp")!,
//     "svix-signature": req.headers.get("svix-signature")!,
//   };
//   const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
//   try {
//     return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
//   } catch (error) {
//     console.error("Error verifying webhook event", error);
//     return null;
//   }
// }

export default http;