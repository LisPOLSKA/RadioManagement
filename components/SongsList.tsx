"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

import AddSongDialog from "./AddSongDialog";
import EditSongDialog from "./EditSongDialog";

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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";
import CategoryDropdown from "./CategoryDropdown";

export default function SongsList() {
    const [artist, setArtist] = useState("");
    const [category, setCategory] = useState("");
    const [editingSong, setEditingSong] = useState<Doc<"songs"> | null>(null);

    const {
        results: songs,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.songs.getSongs,
        { artist: artist || undefined, category: category || undefined },
        { initialNumItems: 20 }
    );

    const deleteSong = useMutation(api.songs.deleteSong);

    async function handleDelete(songId: Id<"songs">) {
        if (!confirm("Are you sure you want to delete this song?")) return;
        try {
        await deleteSong({ songId });
        toast.success("Song deleted");
        } catch (err) {
        toast.error("Failed to delete song");
        console.error(err);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Songs</h1>
                <AddSongDialog />
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-end">
                <div className="flex-3 min-w-50">
                    <Input
                        placeholder="Filter by artist"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-37.5">
                    <CategoryDropdown
                        selectedCategory={category}
                        onChange={setCategory}
                        categoryAll={true}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Spotify</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {songs.length === 0 && status === "LoadingFirstPage" && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Loading songs…
                        </TableCell>
                    </TableRow>
                    )}

                    {songs.length === 0 && status !== "LoadingFirstPage" && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No songs found
                        </TableCell>
                    </TableRow>
                    )}

                {songs.map((song) => (
                    <TableRow key={song._id}>
                        <TableCell className="font-medium">{song.title}</TableCell>
                        <TableCell>{song.artist}</TableCell>
                        <TableCell>{song.category}</TableCell>
                        <TableCell>
                        <a
                            href={song.spotifyLink}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 text-sm"
                        >
                            Open
                        </a>
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                ⋮
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingSong(song)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(song._id)} variant="destructive">
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Pagination */}
        {status === "CanLoadMore" && (
            <div className="flex justify-center">
            <Button variant="outline" onClick={() => loadMore(10)}>
                Load more
            </Button>
            </div>
        )}

        {/* Edit Dialog */}
        {editingSong && (
            <EditSongDialog
            song={editingSong}
            onClose={() => setEditingSong(null)}
            />
        )}
        </div>
    );
}
