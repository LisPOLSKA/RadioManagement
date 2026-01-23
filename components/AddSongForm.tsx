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
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

type SongFormProps = {
  song?: {
    _id: Id<"songs">;
    title: string;
    artist: string;
    category: string;
    ytLink: string;
  };
  onSuccess?: () => void;
};

export default function SongForm({ song, onSuccess }: SongFormProps) {
    const [title, setTitle] = useState(song?.title ?? "");
    const [artist, setArtist] = useState(song?.artist ?? "");
    const [category, setCategory] = useState(song?.category ?? "");
    const [ytLink, setYtLink] = useState(song?.ytLink ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const saveSong = useMutation(api.songs.upsertSong);

    const t = useTranslations("Errors");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title || !artist || !category || !ytLink) {
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
                ytLink,
            });

            toast.success(song ? "Song updated" : "Song added");

            if (!song) {
                setTitle("");
                setArtist("");
                setCategory("");
                setYtLink("");
            }

            onSuccess?.();
        } catch (err) {
            if (err instanceof ConvexError) {
                toast.error(t(err.data));
            } else {
                toast.error("Failed to save song");
                console.error(err);
            }
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
            <Label htmlFor="ytLink">YouTube link</Label>
            <Input
            id="ytLink"
            value={ytLink}
            onChange={(e) => setYtLink(e.target.value)}
            placeholder="https://www.youtube.com/watch"
            />
        </div>

        <Button type="submit" disabled={isSubmitting}>
            {song ? "Save changes" : "Add song"}
        </Button>
        </form>
    );
}
