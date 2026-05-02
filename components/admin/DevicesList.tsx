"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ConvexError } from "convex/values";
import CopyId from "@/components/CopyId";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function DevicesList() {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const {
    results: devices,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.devices.getDevices,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 20 }
  );

  const registerDevice = useMutation(api.devices.registerDevice);
  const deleteDevice = useMutation(api.devices.deleteDevice);

  const t = useTranslations("Errors");
  const tUI = useTranslations("UI");

  async function handleRegisterDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceName.trim() || !deviceToken.trim()) {
      toast.error(tUI("fillAllFields"));
      return;
    }

    try {
      await registerDevice({
        name: deviceName.trim(),
        token: deviceToken.trim(),
      });
      toast.success(tUI("savedSuccessfully"));
      setDeviceName("");
      setDeviceToken("");
      setIsOpen(false);
    } catch (e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to register device");
        console.error(e);
      }
    }
  }

  async function handleDeleteDevice(deviceId: Id<"devices">) {
    if (!confirm(tUI("sure"))) return;
    try {
      await deleteDevice({ deviceId });
      toast.success(tUI("deletedSuccessfully"));
    } catch (e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to delete device");
        console.error(e);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{tUI("devices")}</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {tUI("addDevice")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{tUI("addDevice")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegisterDevice} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{tUI("name")}</Label>
                <Input
                  id="name"
                  placeholder="Device name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="token">Device Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="token"
                    placeholder="Device token"
                    type={showToken ? "text" : "password"}
                    value={deviceToken}
                    onChange={(e) => setDeviceToken(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{tUI("create")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tUI("name")}</TableHead>
              <TableHead>{tUI("active")}</TableHead>
              <TableHead>{tUI("createdAt")}</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">{tUI("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 && status === "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {tUI("loading")}
                </TableCell>
              </TableRow>
            )}

            {devices.length === 0 && status !== "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No devices found
                </TableCell>
              </TableRow>
            )}

            {devices.map((device) => (
              <TableRow key={device._id}>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      device.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {device.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(device.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {device.lastSeenAt
                    ? new Date(device.lastSeenAt).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <CopyId id={device._id} />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteDevice(device._id)}
                  >
                    {tUI("delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(10)}>
            {tUI("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
