"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const Pause = () => {
  const players = useQuery(api.players.getPlayers);
  const setPaused = useMutation(api.players.setPaused);

  const handleStart = async () => {
    try {
      await setPaused({ paused: false });
    } catch (err) {
      console.error("Failed to start", err);
    }
  };

  const handleStop = async () => {
    try {
      await setPaused({ paused: true });
    } catch (err) {
      console.error("Failed to stop", err);
    }
  };

  // Status graczy
  let statusElement: React.ReactNode = <p className="text-sm text-muted-foreground">Loading players…</p>;

  if (players) {
    const allPaused = players.every((p) => p.paused);
    const allPlaying = players.every((p) => !p.paused);

    if (allPaused) {
      statusElement = <p className="text-sm text-center font-medium text-red-600">Paused</p>;
    } else if (allPlaying) {
      statusElement = <p className="text-sm text-center font-medium text-green-600">Not stopped</p>;
    } else {
      // różne stany – pokaz tabelkę
      statusElement = (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p._id.toString()}>
                  <TableCell>{p.deviceId}</TableCell>
                  <TableCell>
                    {p.paused ? (
                      <span className="text-red-600 font-medium">Paused</span>
                    ) : (
                      <span className="text-green-600 font-medium">Not stopped</span>
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
      <h2 className="text-xl font-semibold text-center">Player Controls</h2>

      {/* Status graczy */}
      <div className="w-full">{statusElement}</div>

      {/* Przycisk Start / Stop */}
      <div className="w-full flex gap-3 items-center justify-center">
        <Button
          className="w-full max-w-xs py-2 flex items-center justify-center gap-2"
          variant="outline"
          onClick={handleStart}
        >
          <Play className="w-4 h-4" />
          Start
        </Button>

        <Button
          className="w-full max-w-xs py-2 flex items-center justify-center gap-2"
          variant="destructive"
          onClick={handleStop}
        >
          <Square className="w-4 h-4" />
          Stop
        </Button>
      </div>
    </div>
  );
};

export default Pause;