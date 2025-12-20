"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import CategoryDropdown from "./CategoryDropdown";

type SongFormProps = {
  song?: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    category: string;
    spotifyLink: string;
  };
  onSuccess?: () => void;
};

export default function SongForm({ song, onSuccess }: SongFormProps) {
    const [title, setTitle] = useState(song?.title ?? "");
    const [artist, setArtist] = useState(song?.artist ?? "");
    const [category, setCategory] = useState(song?.category ?? "");
    const [spotifyLink, setSpotifyLink] = useState(song?.spotifyLink ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const saveSong = useMutation(api.songs.upsertSong);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title || !artist || !category || !spotifyLink) {
        toast.error("Please fill in all fields");
        return;
        }

        try {
            setIsSubmitting(true);

            await saveSong({
                songId: song?._id,
                title,
                artist,
                category,
                spotifyLink,
            });

            toast.success(song ? "Song updated" : "Song added");

            if (!song) {
                setTitle("");
                setArtist("");
                setCategory("");
                setSpotifyLink("");
            }

            onSuccess?.();
        } catch (err) {
            toast.error("Something went wrong");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
            />
        </div>

        <div className="grid gap-2">
            <Label htmlFor="artist">Artist</Label>
            <Input
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist"
            />
        </div>

        <CategoryDropdown
            selectedCategory={category}
            onChange={setCategory}
        />

        <div className="grid gap-2">
            <Label htmlFor="spotifyLink">Spotify link</Label>
            <Input
            id="spotifyLink"
            value={spotifyLink}
            onChange={(e) => setSpotifyLink(e.target.value)}
            placeholder="https://open.spotify.com/..."
            />
        </div>

        <Button type="submit" disabled={isSubmitting}>
            {song ? "Save changes" : "Add song"}
        </Button>
        </form>
    );
}
