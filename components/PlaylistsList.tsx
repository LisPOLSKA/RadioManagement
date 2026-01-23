"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import PlaylistDialog from "./PlaylistDialog";
import { toast } from "sonner";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import PlaylistPreview from "./PlaylistPreview";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

export default function PlaylistsList() {
    const [editingPlaylist, setEditingPlaylist] = useState<Doc<"playlists"> | null>(null);
    const [showingPlaylistDialog, setShowingPlaylistDialog] = useState<Doc<"playlists"> | null>(null);

    const { results: playlists, status, loadMore } = usePaginatedQuery(
        api.playlists.getPlaylists, {} , { initialNumItems: 20 }
    );

    const deletePlaylist = useMutation(api.playlists.deletePlaylist);

    const t = useTranslations("Errors");

    async function handleDelete(id: Id<"playlists">) {
        if (!confirm("Are you sure you want to delete this playlist?")) return;
        try {
            await deletePlaylist({ playlistId: id });
            toast.success("Playlist deleted");
        } catch(e) {
            if (e instanceof ConvexError) {
                toast.error(t(e.data));
            } else {
                toast.error("Failed to delete playlist");
                console.error(e);
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Playlists</h1>
                <PlaylistDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Songs</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {playlists.length === 0 && status === "LoadingFirstPage" && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Loading playlists…
                            </TableCell>
                        </TableRow>
                        )}

                        {playlists.length === 0 && status !== "LoadingFirstPage" && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No playlists found
                            </TableCell>
                        </TableRow>
                        )}

                        {playlists.map((pl) => (
                        <TableRow key={pl._id}>
                                <TableCell className="font-medium">{pl.title}</TableCell>
                                <TableCell>{pl.description}</TableCell>
                                <TableCell>{pl.songs.length}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setShowingPlaylistDialog(pl)}>Show</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingPlaylist(pl)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(pl._id)}>Delete</Button>
                                </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {status === "CanLoadMore" && (
                <div className="flex justify-center">
                <Button variant="outline" onClick={() => loadMore(10)}>Load more</Button>
                </div>
            )}

            {editingPlaylist && (
                <PlaylistDialog
                    playlist={editingPlaylist}
                    open={!!editingPlaylist}
                    onOpenChange={(open) => { if (!open) setEditingPlaylist(null); }}
                    hideTrigger
                />
            )}

            {showingPlaylistDialog && (
                <PlaylistPreview
                    playlist={showingPlaylistDialog}
                    open={!!showingPlaylistDialog}
                    onOpenChange={(open) => { if (!open) setShowingPlaylistDialog(null); }}
                    hideTrigger
                />
            )}
        </div>
    );
}
