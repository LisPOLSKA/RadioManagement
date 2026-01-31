"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

const Pause = () => {
  const players = useQuery(api.players.getPlayers);
  const setPaused = useMutation(api.players.setPaused);

  const t = useTranslations("Errors");
  const tUI = useTranslations("UI");

  const handleStart = async () => {
    try {
      await setPaused({ paused: false });
    } catch(e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to unpause players");
        console.error(e);
      }
    }
  };

  const handleStop = async () => {
    try {
      await setPaused({ paused: true });
    } catch(e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to pause players");
        console.error(e);
      }
    }
  };

  // Status graczy
  let statusElement: React.ReactNode = <p className="text-sm text-muted-foreground">{tUI("loadingPlayers")}</p>;

  if (players) {
    const allPaused = players.every((p) => p.paused);
    const allPlaying = players.every((p) => !p.paused);

    if (allPaused) {
      statusElement = <p className="text-sm text-center font-medium text-red-600">{tUI("paused")}</p>;
    } else if (allPlaying) {
      statusElement = <p className="text-sm text-center font-medium text-green-600">{tUI("notStopped")}</p>;
    } else {
      // różne stany – pokaz tabelkę
      statusElement = (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tUI("deviceId")}</TableHead>
                <TableHead>{tUI("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p._id.toString()}>
                  <TableCell>{p.deviceId}</TableCell>
                  <TableCell>
                    {p.paused ? (
                      <span className="text-red-600 font-medium">{tUI("paused")}</span>
                    ) : (
                      <span className="text-green-600 font-medium">{tUI("notStopped")}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Nagłówek */}
      <h2 className="text-xl font-semibold text-center">{tUI("playerControls")}</h2>

      {/* Status graczy */}
      <div className="w-full">{statusElement}</div>

      {/* Przycisk Start / Stop */}
      <div className="w-full flex gap-3 items-center justify-center flex-wrap">
        <Button
          className="w-full max-w-xs py-2 flex items-center justify-center gap-2"
          variant="outline"
          onClick={handleStart}
        >
          <Play className="w-4 h-4" />
          {tUI("start")}
        </Button>

        <Button
          className="w-full max-w-xs py-2 flex items-center justify-center gap-2"
          variant="destructive"
          onClick={handleStop}
        >
          <Square className="w-4 h-4" />
          {tUI("stop")}
        </Button>
      </div>
    </div>
  );
};

export default Pause;