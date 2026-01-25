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
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import CopyId from "./CopyId";

export default function SongsList() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [editingSong, setEditingSong] = useState<Doc<"songs"> | null>(null);
    const [isMine, setIsMine] = useState(true);

    const {
        results: songs,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.songs.getSongs,
        { search: search || undefined, category: category || undefined, mine: isMine },
        { initialNumItems: 20 }
    );

    const deleteSong = useMutation(api.songs.deleteSong);

    const t = useTranslations("Errors");
    const tUI = useTranslations("UI");

    async function handleDelete(songId: Id<"songs">) {
        if (!confirm(tUI("sureSongDelete"))) return;
        try {
            await deleteSong({ songId });
            toast.success(tUI("deletedSuccessfully"));
        } catch(e) {
            if (e instanceof ConvexError) {
                toast.error(t(e.data));
            } else {
                toast.error("Failed to delete song");
                console.error(e);
            }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">{tUI("songs")}</h1>
                <AddSongDialog />
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-end">
                <div className="flex-3 min-w-50">
                    <Input
                        placeholder={tUI("searchByTitleOrArtist")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-37.5">
                    <CategoryDropdown
                        selectedCategory={category}
                        onChange={setCategory}
                        categoryAll={true}
                    />
                </div>
                <div className="flex-1 min-w-24 flex items-center h-9">
                    <Checkbox checked={isMine} onCheckedChange={(checked) => setIsMine(checked === true)} className="h-6 w-6" id="isMine"/>
                    <Label htmlFor="isMine" className="ml-2">{tUI("showMine")}</Label>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{tUI("title")}</TableHead>
                    <TableHead>{tUI("artist")}</TableHead>
                    <TableHead>{tUI("category")}</TableHead>
                    <TableHead>YouTube</TableHead>
                    <TableHead className="text-right">{tUI("actions")}</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {songs.length === 0 && status === "LoadingFirstPage" && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {tUI("loadingSongs")}
                        </TableCell>
                    </TableRow>
                    )}

                    {songs.length === 0 && status !== "LoadingFirstPage" && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {tUI("noSongs")}
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
                            href={song.ytLink}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 text-sm"
                        >
                            {tUI("open")}
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
                                {tUI("edit")}
                            </DropdownMenuItem>
                            <CopyId id={song._id} isMenuItem />
                            <DropdownMenuItem onClick={() => handleDelete(song._id)} variant="destructive">
                                {tUI("delete")}
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
                {tUI("loadMore")}
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
