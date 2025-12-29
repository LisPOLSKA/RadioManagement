import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  users: {
    getUser: FunctionReference<"query", "public", { clerkId: string }, any>;
    getUsers: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        search?: string;
      },
      any
    >;
    setUserRole: FunctionReference<
      "mutation",
      "public",
      { role: number; userId: Id<"users"> },
      any
    >;
    findUserById: FunctionReference<"query", "public", { userId: string }, any>;
  };
  songs: {
    upsertSong: FunctionReference<
      "mutation",
      "public",
      {
        artist: string;
        category: string;
        songId?: Id<"songs">;
        spotifyLink: string;
        title: string;
      },
      any
    >;
    getSongs: FunctionReference<
      "query",
      "public",
      {
        artist?: string;
        category?: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
    deleteSong: FunctionReference<
      "mutation",
      "public",
      { songId: Id<"songs"> },
      any
    >;
  };
  playlists: {
    upsertPlaylist: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        playlistId?: Id<"playlists">;
        songs: Array<Id<"songs">>;
        title: string;
      },
      any
    >;
    deletePlaylist: FunctionReference<
      "mutation",
      "public",
      { playlistId: Id<"playlists"> },
      any
    >;
    getPlaylists: FunctionReference<
      "query",
      "public",
      {
        createdBy?: Id<"users">;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        title?: string;
      },
      any
    >;
    upsertSelectedPlaylist: FunctionReference<
      "mutation",
      "public",
      {
        endDate: number;
        playlistId: Id<"playlists">;
        priority: number;
        schedule?: Array<number>;
        selectedPlaylistId?: Id<"selectedPlaylists">;
        startDate: number;
      },
      any
    >;
    deleteSelectedPlaylist: FunctionReference<
      "mutation",
      "public",
      { selectedPlaylistId: Id<"selectedPlaylists"> },
      any
    >;
    getSelectedPlaylists: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
  };
  schedules: {
    upsertSchedule: FunctionReference<
      "mutation",
      "public",
      {
        description: string;
        events: Array<{
          endHour: number;
          endMinute: number;
          id?: Id<"scheduleEvents">;
          startHour: number;
          startMinute: number;
        }>;
        groupId?: Id<"scheduleGroups">;
        name: string;
      },
      any
    >;
    getSchedules: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
    getSchedule: FunctionReference<
      "query",
      "public",
      { groupId: Id<"scheduleGroups"> },
      any
    >;
    deleteSchedule: FunctionReference<
      "mutation",
      "public",
      { groupId: Id<"scheduleGroups"> },
      any
    >;
    upsertSelectedSchedule: FunctionReference<
      "mutation",
      "public",
      {
        endDate?: number;
        priority: number;
        schedule?: Array<number>;
        scheduleId: Id<"scheduleGroups">;
        selectedScheduleId?: Id<"selectedSchedules">;
        startDate?: number;
      },
      any
    >;
    getSelectedSchedules: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
    deleteSelectedSchedule: FunctionReference<
      "mutation",
      "public",
      { selectedScheduleId: Id<"selectedSchedules"> },
      any
    >;
  };
  exceptions: {
    upsertException: FunctionReference<
      "mutation",
      "public",
      {
        action: "SKIP_DAY" | "SKIP_EVENT" | "MODIFY_EVENT";
        dayOfWeek: Array<number>;
        endDate: number;
        endHour?: number;
        endMinute?: number;
        eventId?: Id<"scheduleEvents">;
        exceptionId?: Id<"exceptions">;
        groupId: Id<"scheduleGroups">;
        priority?: number;
        startDate: number;
        startHour?: number;
        startMinute?: number;
        title?: string;
      },
      any
    >;
    deleteException: FunctionReference<
      "mutation",
      "public",
      { exceptionId: Id<"exceptions"> },
      any
    >;
    getExceptions: FunctionReference<
      "query",
      "public",
      {
        groupId?: Id<"scheduleGroups">;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
  };
  logs: {
    getLogs: FunctionReference<
      "query",
      "public",
      {
        action?: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        targetId?: string;
        targetTable?: string;
        userId?: Id<"users">;
      },
      any
    >;
  };
  devices: {
    registerDevice: FunctionReference<
      "mutation",
      "public",
      { name: string; token: string },
      any
    >;
  };
  players: {
    getPlayerState: FunctionReference<
      "query",
      "public",
      { token: string },
      any
    >;
    setPaused: FunctionReference<
      "mutation",
      "public",
      { paused: boolean; token: string },
      any
    >;
    getActivePlaylist: FunctionReference<
      "query",
      "public",
      { token: string },
      any
    >;
    getScheduleForDay: FunctionReference<
      "query",
      "public",
      { date: number; token: string },
      any
    >;
    getPlaylistById: FunctionReference<
      "query",
      "public",
      { playlistId: Id<"playlists">; token: string },
      any
    >;
    getSongsBulk: FunctionReference<
      "query",
      "public",
      { ids: Array<Id<"songs">>; token: string },
      any
    >;
    getSongById: FunctionReference<
      "query",
      "public",
      { songId: Id<"songs">; token: string },
      any
    >;
  };
};
export type InternalApiType = {};
