import { paginationOptsValidator } from "convex/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";

export const upsertSchedule = mutation({
    args: {
        groupId: v.optional(v.id("scheduleGroups")),
        name: v.string(),
        description: v.string(),
        events: v.array(
            v.object({
                id: v.optional(v.id("scheduleEvents")),
                startHour: v.number(),
                startMinute: v.number(),
                endHour: v.number(),
                endMinute: v.number(),
            })
        ),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();

        if (!user || user.role <= 0) throw new Error("Forbidden");

        // =========================
        // 0️⃣ WALIDACJA EVENTÓW
        // =========================
        const validateEvent = (ev: typeof args.events[number]) => {
            if (
                ev.startHour < 0 || ev.startHour > 23 ||
                ev.endHour < 0 || ev.endHour > 23 ||
                ev.startMinute < 0 || ev.startMinute > 59 ||
                ev.endMinute < 0 || ev.endMinute > 59
            ) {
                throw new Error("Invalid time: hours 0-23, minutes 0-59");
            }
            const startTotal = ev.startHour * 60 + ev.startMinute;
            const endTotal = ev.endHour * 60 + ev.endMinute;
            if (startTotal >= endTotal) {
                throw new Error("Event start must be before end");
            }
            return { startTotal, endTotal };
        };

        // sprawdzenie nakładania się eventów
        const timeRanges = args.events.map(ev => validateEvent(ev));
        for (let i = 0; i < timeRanges.length; i++) {
            for (let j = i + 1; j < timeRanges.length; j++) {
                if (
                    timeRanges[i].startTotal < timeRanges[j].endTotal &&
                    timeRanges[i].endTotal > timeRanges[j].startTotal
                ) {
                    throw new Error("Events cannot overlap");
                }
            }
        }

        let groupId = args.groupId;

        // =========================
        // 1️⃣ CREATE / UPDATE GROUP
        // =========================
        if (groupId) {
            const existingGroup = await ctx.db.get(groupId);
            if (!existingGroup) throw new Error("Not found");

            // 🔐 AUTORYZACJA
            if (user.role < 2 && existingGroup.createdBy !== user._id) {
                throw new Error("Forbidden");
            }

            await ctx.db.patch(groupId, {
                name: args.name,
                description: args.description,
            });

            await ctx.runMutation(internal.logs.logAdminAction, {
                userId: user._id,
                action: "UPDATE_SCHEDULE_GROUP",
                targetTable: "scheduleGroups",
                targetId: groupId,
                details: JSON.stringify({
                    name: args.name,
                    description: args.description,
                }),
            });
        } else {
            groupId = await ctx.db.insert("scheduleGroups", {
                name: args.name,
                description: args.description,
                createdBy: user._id,
            });

            await ctx.runMutation(internal.logs.logAdminAction, {
                userId: user._id,
                action: "CREATE_SCHEDULE_GROUP",
                targetTable: "scheduleGroups",
                targetId: groupId,
                details: JSON.stringify({
                    name: args.name,
                    description: args.description,
                }),
            });
        }

        // =========================
        // 2️⃣ EXISTING EVENTS
        // =========================
        const existingEvents = await ctx.db
            .query("scheduleEvents")
            .withIndex("by_groupId", q => q.eq("groupId", groupId))
            .collect();

        const incomingIds = new Set(args.events.filter(e => e.id).map(e => e.id!));

        // =========================
        // 3️⃣ DELETE REMOVED EVENTS
        // =========================
        for (const ev of existingEvents) {
            if (user.role < 2 && ev.createdBy !== user._id) {
                throw new Error("Forbidden");
            }
            if (!incomingIds.has(ev._id)) {
                await ctx.db.delete(ev._id);
            }
        }

        // =========================
        // 4️⃣ UPSERT EVENTS
        // =========================
        for (const ev of args.events) {
            const data = {
                groupId,
                startHour: ev.startHour,
                startMinute: ev.startMinute,
                endHour: ev.endHour,
                endMinute: ev.endMinute,
                createdBy: user._id,
            };

            if (ev.id) {
                const existingEvent = await ctx.db.get(ev.id);
                if (!existingEvent) throw new Error("Event not found");
                if (user.role < 2 && existingEvent.createdBy !== user._id) {
                    throw new Error("Forbidden");
                }
                await ctx.db.patch(ev.id, data);
            } else {
                await ctx.db.insert("scheduleEvents", data);
            }

            await ctx.runMutation(internal.logs.logAdminAction, {
                userId: user._id,
                action: "UPDATE_SCHEDULE_EVENT",
                targetTable: "scheduleEvents",
                targetId: ev.id,
                details: JSON.stringify(data),
            });
        }

        return groupId;
    },
});

export const getSchedules = query({
  args: {
    paginationOpts: paginationOptsValidator,
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

    const schedules = await ctx.db
      .query("scheduleGroups")
      .withIndex("by_createdBy", q => q.eq("createdBy", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    return schedules;
  },
});

export const getSchedule = query({
  args: {
    groupId: v.id("scheduleGroups"),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Not found");

    // 🔐 AUTORYZACJA
    if (user.role < 2 && group.createdBy !== user._id) {
      throw new Error("Forbidden");
    }

    const events = await ctx.db
      .query("scheduleEvents")
      .withIndex("by_groupId", q => q.eq("groupId", args.groupId))
      .order("asc")
      .collect();

    return {
      ...group,
      events,
    };
  },
});

export const deleteSchedule = mutation({
  args: {
    groupId: v.id("scheduleGroups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("UNAUTHORIZED");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .first();

    // 🔐 TYLKO ADMIN
    if (!user || user.role < 2) {
      throw new ConvexError("INSUFFICIENT_PERMISSIONS");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("NOT_FOUND");
    }

    // 🧹 usuń eventy
    const events = await ctx.db
      .query("scheduleEvents")
      .withIndex("by_groupId", q => q.eq("groupId", args.groupId))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // 🗑 usuń grupę
    await ctx.db.delete(args.groupId);

    await ctx.runMutation(internal.logs.logAdminAction, {
      userId: user._id,
      action: "DELETE_SCHEDULE_GROUP",
      targetTable: "scheduleGroups",
      targetId: args.groupId,
    });
  },
});

export const upsertSelectedSchedule = mutation({
    args: {
        selectedScheduleId: v.optional(v.id("selectedSchedules")),
        scheduleId: v.id("scheduleGroups"),
        priority: v.number(),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        schedule: v.optional(v.array(v.number())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();
        if (!user || user.role <= 0) throw new Error("Forbidden");

        // sprawdź uprawnienia dla edycji
        if (args.selectedScheduleId) {
            const existing = await ctx.db.get(args.selectedScheduleId);
            if (!existing) throw new Error("Not found");
            if (user.role < 2 && existing.createdBy !== user._id) {
                throw new Error("Forbidden");
            }

            await ctx.db.patch(args.selectedScheduleId, {
                scheduleId: args.scheduleId,
                priority: args.priority,
                startDate: args.startDate,
                endDate: args.endDate,
                schedule: args.schedule,
            });

            await ctx.runMutation(internal.logs.logAdminAction, {
                userId: user._id,
                action: "UPDATE_SELECTED_SCHEDULE",
                targetTable: "selectedSchedules",
                targetId: args.selectedScheduleId,
                details: JSON.stringify({
                    scheduleId: args.scheduleId,
                    priority: args.priority,
                    startDate: args.startDate,
                    endDate: args.endDate,
                    schedule: args.schedule,
                }),
            });

            return args.selectedScheduleId;
        } else {
            const newId = await ctx.db.insert("selectedSchedules", {
                scheduleId: args.scheduleId,
                priority: args.priority,
                startDate: args.startDate,
                endDate: args.endDate,
                createdBy: user._id,
                schedule: args.schedule,
            });

            await ctx.runMutation(internal.logs.logAdminAction, {
                userId: user._id,
                action: "CREATE_SELECTED_SCHEDULE",
                targetTable: "selectedSchedules",
                targetId: newId,
                details: JSON.stringify({
                    scheduleId: args.scheduleId,
                    priority: args.priority,
                    startDate: args.startDate,
                    endDate: args.endDate,
                    schedule: args.schedule,
                }),
            });

            return newId;
        }
    }
});

export const getSelectedSchedules = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();
        if (!user || user.role <= 0) throw new Error("Forbidden");

        const page = await ctx.db.query("selectedSchedules")
            .withIndex("by_createdBy", q => q.eq("createdBy", user._id))
            .order("desc")
            .paginate(args.paginationOpts);

        // dołączamy nazwę schedule
        const resultsWithNames = await Promise.all(
            page.page.map(async (ss) => {
                const schedule = await ctx.db.get(ss.scheduleId);
                return {
                    ...ss,
                    scheduleName: schedule?.name || "Unknown",
                };
            })
        );

        return {
            ...page,
            page: resultsWithNames,
        };
    }
});

export const deleteSelectedSchedule = mutation({
    args: {
        selectedScheduleId: v.id("selectedSchedules"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();
        if (!user || user.role <= 0) throw new Error("Forbidden");

        const existing = await ctx.db.get(args.selectedScheduleId);
        if (!existing) throw new Error("Not found");
        if (user.role < 2 && existing.createdBy !== user._id) {
            throw new Error("Forbidden");
        }

        await ctx.db.delete(args.selectedScheduleId);

        await ctx.runMutation(internal.logs.logAdminAction, {
            userId: user._id,
            action: "DELETE_SELECTED_SCHEDULE",
            targetTable: "selectedSchedules",
            targetId: args.selectedScheduleId,
        });
    }
});

export const getScheduleForDay = internalQuery({
    args: {
        date: v.number(), // timestamp (ms)
    },
    handler: async (ctx, args) => {
        const date = new Date(args.date);
        const todayJs = date.getDay();
        const dayOfWeek = (todayJs - 1)%7;
        const ts = args.date;

        // ======================================
        // 1️⃣ POBIERZ ACTIVE SELECTED SCHEDULES Z UŻYCIEM INDEXU
        // ======================================
        const selected = await ctx.db
            .query("selectedSchedules")
            .withIndex("by_endDate", q => q.gte("endDate", args.date))
            .collect();

        // filtrujemy po endDate + startDate
        const active = selected
            .filter(ss => {
                if (ss.startDate && ts < ss.startDate) return false;
                if (ss.schedule && !ss.schedule.includes(dayOfWeek)) return false;
                return true;
            })
            .sort((a, b) => b.priority - a.priority);

        if (active.length === 0) {
            return {
                schedule: null,
                events: [],
            };
        }

        // 👉 WYGRYWA NAJWYŻSZY PRIORITY
        const selectedSchedule = active[0];

        // ======================================
        // 2️⃣ POBIERZ BASE SCHEDULE + EVENTY
        // ======================================
        const group = await ctx.db.get(selectedSchedule.scheduleId);
        if (!group) throw new Error("Schedule not found");

        const baseEvents = await ctx.db
            .query("scheduleEvents")
            .withIndex("by_groupId", q => q.eq("groupId", group._id))
            .order("asc")
            .collect();

        // ======================================
        // 3️⃣ POBIERZ WYJĄTKI
        // ======================================
        const exceptions = await ctx.db
            .query("exceptions")
            .withIndex("by_groupId", q => q.eq("groupId", group._id))
            .collect();

        const activeExceptions = exceptions.filter(ex => {
            if (ts < ex.startDate) return false;
            if (ex.endDate && ts > ex.endDate) return false;
            if (ex.dayOfWeek !== undefined && !ex.dayOfWeek.includes(dayOfWeek)) return false;
            return true;
        });

        // sort by priority (jeśli dodasz priority)
        activeExceptions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        // ======================================
        // 4️⃣ SKIP DAY?
        // ======================================
        if (
            activeExceptions.some(ex => ex.action === "SKIP_DAY")
        ) {
            return {
                schedule: group,
                events: [],
            };
        }

        // ======================================
        // 5️⃣ RESOLVE EVENTY
        // ======================================
        const resolvedEvents = baseEvents
            .filter(ev => {
                // SKIP_EVENT
                return !activeExceptions.some(ex =>
                    ex.action === "SKIP_EVENT" &&
                    ex.eventId === ev._id
                );
            })
            .map(ev => {
                const mod = activeExceptions.find(ex =>
                    ex.action === "MODIFY_EVENT" &&
                    ex.eventId === ev._id
                );

                if (!mod) return ev;

                return {
                    ...ev,
                    startHour: mod.startHour ?? ev.startHour,
                    startMinute: mod.startMinute ?? ev.startMinute,
                    endHour: mod.endHour ?? ev.endHour,
                    endMinute: mod.endMinute ?? ev.endMinute,
                };
            });

        return {
            schedule: group,
            selectedSchedule,
            events: resolvedEvents,
        };
    },
});