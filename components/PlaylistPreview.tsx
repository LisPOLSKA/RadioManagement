"use client";

import { useState, useMemo } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

type Props = {
  playlist?: Doc<"playlists">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

const PlaylistPreview = ({ playlist, open, onOpenChange, hideTrigger }: Props) => {
  const [search, setSearch] = useState("");
  const songs = useQuery(
    api.songs.getSongsByIds,
    playlist?.songs ? { ids: playlist.songs } : "skip"
  );

  const t = useTranslations("UI");

  if (!playlist) return null;

  // filtrowanie songs wg wyszukiwarki
  const filteredSongs = useMemo(() => {
    if (!songs) return [];
    if (!search.trim()) return songs;

    const lower = search.toLowerCase();
    return songs.filter((s) =>
      s &&
      (s.title.toLowerCase().includes(lower) ||
        s.artist.toLowerCase().includes(lower) ||
        s.category.toLowerCase().includes(lower))
    );
  }, [songs, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild hidden={hideTrigger}>
        <Button variant="outline">{t("playlistPreview")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("playlistPreview")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div>
            <h3 className="text-sm text-muted-foreground">{t("title")}</h3>
            <p className="text-lg font-medium">{playlist.title}</p>
          </div>

          {/* Description */}
          {playlist.description && (
            <div>
              <h3 className="text-sm text-muted-foreground">{t("description")}</h3>
              <p>{playlist.description}</p>
            </div>
          )}

          {/* Search */}
          <div className="mb-2">
            <Input
              placeholder={t("searchSongs")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Songs */}
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">
              {t("songs")}: ({filteredSongs.length})
            </h3>

            {!songs && (
              <p className="text-sm text-muted-foreground">{t("loadingSongs")}</p>
            )}

            {songs && filteredSongs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("noSongsMatch")}
              </p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredSongs.map((song, index) => {
                if (!song) {
                  return (
                    <div
                      key={`missing-${index}`}
                      className="text-sm text-muted-foreground italic"
                    >
                      {t("songNotFound")}
                    </div>
                  );
                }

                return (
                  <div
                    key={song._id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium leading-tight">{song.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {song.artist} • {song.category}
                      </p>
                    </div>

                    <a
                      href={song.ytLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      title={t("openInYouTube")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaylistPreview;