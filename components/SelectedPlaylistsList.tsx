"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import SelectedPlaylistDialog from "./SelectedPlaylistDialog";
import { toast } from "sonner";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

export default function SelectedPlaylistsList() {
    const [editing, setEditing] = useState<Doc<"selectedPlaylists"> | null>(null);


    const { results, status, loadMore } = usePaginatedQuery(
        api.playlists.getSelectedPlaylists,
        {},
        { initialNumItems: 20 }
    );

    const deleteSP = useMutation(api.playlists.deleteSelectedPlaylist);

    const t = useTranslations("Errors");

    const handleDelete = async (id: Id<"selectedPlaylists">) => {
        if (!confirm("Are you sure you want to delete this selected playlist?")) return;
        try {
            await deleteSP({ selectedPlaylistId: id });
            toast.success("Deleted successfully");
        } catch(e) {
            if (e instanceof ConvexError) {
                toast.error(t(e.data));
            } else {
                toast.error("Failed to delete selected playlist");
                console.error(e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Selected Playlists</h1>
                <SelectedPlaylistDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Playlist</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {results.length === 0 && status === "LoadingFirstPage" && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        )}

                        {results.length === 0 && status !== "LoadingFirstPage" && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No selected playlists
                                </TableCell>
                            </TableRow>
                        )}

                        {results.map((sp) => (
                            <TableRow key={sp._id}>
                                <TableCell>{sp.playlistName}</TableCell>
                                <TableCell>{sp.priority}</TableCell>
                                <TableCell>{sp.startDate ? new Date(sp.startDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell>{sp.endDate ? new Date(sp.endDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setEditing(sp)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(sp._id)}>Delete</Button>
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

            {editing && <SelectedPlaylistDialog selectedPlaylist={editing} onClose={() => setEditing(null)} hideTrigger/>}
        </div>
    );
}
