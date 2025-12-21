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
  playlists: defineTable({
    title: v.string(),
    songs: v.array(v.id("songs")),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_title", ["title"]),
  selectedPlaylists: defineTable({
    playlistId: v.id("playlists"),
    priority: v.number(),
    schedule: v.optional(v.array(v.number())), // dni tygodnia (0-6)
    startDate: v.optional(v.number()), // timestamp w ms
    endDate: v.optional(v.number()),   // timestamp w ms
    createdBy: v.id("users"),
  })
    .index("by_startDate", ["startDate"])
    .index("by_endDate", ["endDate"])
    .index("by_priority", ["priority"])
    .index("by_active_period", ["startDate", "endDate"])
    .index("by_createdBy", ["createdBy"]),
  scheduleGroups: defineTable({
    name: v.string(),
    description: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_createdBy", ["createdBy"]),
  scheduleEvents: defineTable({
    groupId: v.id("scheduleGroups"),
    startHour: v.number(),
    startMinute: v.number(),
    endHour: v.number(),
    endMinute: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_groupId", ["groupId"])
    .index("by_createdBy", ["createdBy"]),
  selectedSchedules: defineTable({
    scheduleId: v.id("scheduleGroups"),
    priority: v.number(),
    schedule: v.optional(v.array(v.number())),
    startDate: v.optional(v.number()), // timestamp w ms
    endDate: v.optional(v.number()),   // timestamp w ms
    createdBy: v.id("users"),
  })
    .index("by_startDate", ["startDate"])
    .index("by_endDate", ["endDate"])
    .index("by_priority", ["priority"])
    .index("by_createdBy", ["createdBy"]),

});