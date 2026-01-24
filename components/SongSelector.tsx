"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CategoryDropdown from "./CategoryDropdown";
import { useTranslations } from "next-intl";

type Props = {
    selectedSongs: Id<"songs">[];
    onChange: (ids: Id<"songs">[]) => void;
};

const SongSelector: React.FC<Props> = ({ selectedSongs, onChange }) => {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");

    const { results: songs } = usePaginatedQuery(
        api.songs.getSongs,
        { 
            search: search || undefined,
            category: category || undefined
        },
        { initialNumItems: 50 }
    );

    const toggleSong = (id: Id<"songs">) => {
        if (selectedSongs.includes(id)) {
            onChange(selectedSongs.filter((s) => s !== id));
        } else {
            onChange([...selectedSongs, id]);
        }
    };

    const t = useTranslations("UI");

    return (
        <div className="grid gap-2">
            <Label>{t("filterSongs")}</Label>
            <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-50">
                    <Input
                        placeholder={t("searchByTitleOrArtist")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-40 min-w-37.5">
                    <CategoryDropdown
                        selectedCategory={category}
                        onChange={(val) => setCategory(val === "ALL" ? "" : val)}
                        categoryAll={true}
                    />
                </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md p-2 mt-1">
                {songs.map((song) => (
                    <div key={song._id} className="flex items-center gap-2">
                        <Checkbox
                            checked={selectedSongs.includes(song._id)}
                            onCheckedChange={() => toggleSong(song._id)}
                        />
                        <span>{song.title} - {song.artist} ({song.category})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SongSelector;