"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import CategoryDropdown from "./CategoryDropdown";

type Props = {
  song: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    category: string;
    spotifyLink: string;
  };
  onClose: () => void;
};

export default function EditSongDialog({ song, onClose }: Props) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [category, setCategory] = useState(song.category);
  const [spotifyLink, setSpotifyLink] = useState(song.spotifyLink);

  const upsertSong = useMutation(api.songs.upsertSong);

  // Reset state if song changes
    useEffect(() => {
        setTitle(song.title);
        setArtist(song.artist);
        setCategory(song.category);
        setSpotifyLink(song.spotifyLink);
    }, [song]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title || !artist || !category || !spotifyLink) {
        toast.error("Please fill in all fields");
        return;
        }

        try {
            await upsertSong({
                songId: song._id,
                title,
                artist,
                category,
                spotifyLink,
            });
            toast.success("Song updated");
            onClose();
        } catch (err) {
            toast.error("Failed to update song");
            console.error(err);
        }
    }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song Title"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist"
              required
            />
          </div>

          <CategoryDropdown 
            selectedCategory={category}
            onChange={setCategory}
          />

          <div className="grid gap-2">
            <Label htmlFor="spotifyLink">Spotify Link</Label>
            <Input
              id="spotifyLink"
              value={spotifyLink}
              onChange={(e) => setSpotifyLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="submit">Save</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
