import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    //clerkId: v.optional(v.string()),
    email: v.string(),
    displayName: v.string(),
    role: v.number(),
    searchKey: v.string(),
    deviceId: v.optional(v.id("devices")),
    //type: v.optional(v.union(v.literal("player"), v.literal("user"))),
    comment: v.optional(v.string()),
  })
    //.index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_displayName", ["displayName"])
    .index("by_searchKey", ["searchKey"]),
  songs: defineTable({
    title: v.string(),
    artist: v.string(),
    category: v.string(),
    ytLink: v.string(),
    createdBy: v.id("users"),
    searchKey: v.string(),
  })
    .index("by_category_createdBy", ["category", "createdBy"])
    .index("by_createdBy", ["createdBy"])
    .index("by_ytLink", ["ytLink"])
    .searchIndex("search_by_title_artist", {
      searchField: "searchKey",
      filterFields: ["category", "createdBy"],
    }),
  playlists: defineTable({
    title: v.string(),
    songs: v.array(v.id("songs")),
    description: v.optional(v.string()),
    sourcePlaylistId: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .searchIndex("search_by_title_createdBy", {
      searchField: "title",
      filterFields: ["createdBy"],
    })
    .index("by_createdBy", ["createdBy"])
    .index("by_createdBy_sourcePlaylistId", ["createdBy", "sourcePlaylistId"]),
  selectedPlaylists: defineTable({
    playlistId: v.array(v.id("playlists")),
    priority: v.number(),
    schedule: v.optional(v.array(v.number())), // dni tygodnia (0-6)
    startDate: v.number(), // timestamp w ms
    endDate: v.number(),   // timestamp w ms
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
  exceptions: defineTable({
    groupId: v.id("scheduleGroups"),
    title: v.optional(v.string()),

    startDate: v.number(), // timestamp w ms
    endDate: v.number(),   // timestamp w ms

    dayOfWeek: v.array(v.number()), // 0-6

    eventId: v.optional(v.id("scheduleEvents")),

    action: v.union(
      v.literal("MODIFY_EVENT"),
      v.literal("SKIP_EVENT"),
      v.literal("SKIP_DAY")
    ),

    startHour: v.optional(v.number()),
    startMinute: v.optional(v.number()),
    endHour: v.optional(v.number()),
    endMinute: v.optional(v.number()),

    priority: v.optional(v.number()),

    createdBy: v.id("users"),
  })
    .index("by_groupId", ["groupId"])
    .index("by_eventId", ["eventId"])
    .index("by_dateRange", ["startDate", "endDate"]),
  logs: defineTable({
    createdBy: v.optional(v.id("users")),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_action", ["action"])
    .index("by_targetTable", ["targetTable"])
    .index("by_targetId", ["targetId"])
    .index("by_createdBy_action", ["createdBy", "action"])
    .index("by_targetTable_targetId", ["targetTable", "targetId"])
    .index("by_createdAt", ["createdAt"]),
  devices: defineTable({
    name: v.string(),
    tokenHash: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_active", ["active"]),
  players: defineTable({
    deviceId: v.id("devices"),
    paused: v.boolean(),
    volume: v.number(),
    updatedAt: v.number(),
  })
    .index("by_deviceId", ["deviceId"]),
});