"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import SongSelector from "./SongSelector";
import { Plus } from "lucide-react";

type Props = {
  playlist?: Doc<"playlists">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export default function PlaylistDialog({ playlist, open, onOpenChange, hideTrigger }: Props) {
  const [title, setTitle] = useState(playlist?.title || "");
  const [description, setDescription] = useState(playlist?.description || "");
  const [selectedSongs, setSelectedSongs] = useState<Id<"songs">[]>(playlist?.songs || []);

  const upsertPlaylist = useMutation(api.playlists.upsertPlaylist);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title || selectedSongs.length === 0) {
      toast.error("Title and at least one song are required");
      return;
    }

    try {
      await upsertPlaylist({
        title,
        description,
        songs: selectedSongs,
        playlistId: playlist?._id || undefined,
      });
      toast.success("Playlist saved");
      onOpenChange?.(false); // zamyka dialog po submit
    } catch (err) {
      toast.error("Failed to save playlist");
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild hidden={hideTrigger}>
        <Button variant={"outline"}><Plus className="mr-2 h-4 w-4" />{playlist ? "Edit Playlist" : "Add Playlist"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{playlist ? "Edit Playlist" : "New Playlist"}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4 py-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title"/>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"/>
          </div>

          <SongSelector selectedSongs={selectedSongs} onChange={setSelectedSongs} />

          <DialogFooter>
            <Button type="submit">{playlist ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
