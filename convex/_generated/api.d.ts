/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as devices from "../devices.js";
import type * as exceptions from "../exceptions.js";
import type * as http from "../http.js";
import type * as logs from "../logs.js";
import type * as playlists from "../playlists.js";
import type * as schedules from "../schedules.js";
import type * as songs from "../songs.js";
import type * as users from "../users.js";
import type * as utils_hash from "../utils/hash.js";
import type * as utils_requireDevice from "../utils/requireDevice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  devices: typeof devices;
  exceptions: typeof exceptions;
  http: typeof http;
  logs: typeof logs;
  playlists: typeof playlists;
  schedules: typeof schedules;
  songs: typeof songs;
  users: typeof users;
  "utils/hash": typeof utils_hash;
  "utils/requireDevice": typeof utils_requireDevice;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
