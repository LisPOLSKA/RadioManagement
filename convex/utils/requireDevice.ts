// convex/auth/device.ts
import { GenericActionCtx } from "convex/server";
import { sha256 } from "./hash";
import { internal } from "../_generated/api";

export async function requireDeviceFromRequest(
  ctx: GenericActionCtx<any>,
  req: Request
) {
  const token = req.headers.get("x-device-token");
  if (!token) {
    throw new Error("No device token");
  }

  const tokenHash = await sha256(token);

  // pobieranie urządzenia (przez query)
  const device = await ctx.runQuery(
    // tu używasz wcześniej zdefiniowanej query
    // która wyszukuje urządzenie po hash
    internal.devices.getByTokenHash,
    { tokenHash: tokenHash }
  );

  if (!device || !device.active) {
    throw new Error("Invalid device");
  }

  // jeśli chcesz heartbeat (aktualizacja lastSeenAt)
  await ctx.runMutation(internal.devices.updateLastSeenAt, {
    deviceId: device._id,
    lastSeenAt: Date.now(),
  });

  return device;
}