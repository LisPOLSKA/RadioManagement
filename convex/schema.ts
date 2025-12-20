import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_displayName", ["displayName"]),
  songs: defineTable({
    title: v.string(),
    artist: v.string(),
    category: v.string(),
    spotifyLink: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_title", ["title"])
    .index("by_artist", ["artist"])
    .index("by_category", ["category"])
    .index("by_spotifyLink", ["spotifyLink"])
    .index("by_category_artist", ["category", "artist"]),
});