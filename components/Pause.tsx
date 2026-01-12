"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

const Pause = () => {
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

  return (
    <div className="w-full space-y-4">
      {/* Nagłówek */}
      <h2 className="text-xl font-semibold text-center">Player Controls</h2>

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