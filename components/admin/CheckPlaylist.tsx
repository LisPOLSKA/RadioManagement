"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CheckPlaylist() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const timestamp = new Date(date).setHours(0, 0, 0, 0);

  // pobranie aktywnej playlisty
  const selectedPlaylists = useQuery(api.playlists.getActivePlaylistForTime, { date: timestamp });
  const selectedPlaylist = selectedPlaylists?.[0];

  const playlist = useQuery(api.playlists.getPublicPlaylistById, selectedPlaylist?.playlistId ?  { playlistId: selectedPlaylist?.playlistId } : "skip");

  // pobranie pierwszych 10 piosenek
  const songs = useQuery(
    api.songs.getSongsByIds,
    playlist ? { ids: playlist.songs ? playlist.songs.slice(0, 10) : [] } : "skip"
  );

  const t = useTranslations("UI");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("activePlaylistPreview")}</h1>

      {/* Datetime picker */}
      <div className="flex gap-3 flex-wrap">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[250px]"
        />
      </div>

      {!playlist && <p className="text-sm text-muted-foreground">{t("noActivePlaylist")}</p>}

      {playlist && (
        <div className="space-y-4">
          {/* Playlist info */}
          <div>
            <h3 className="text-sm text-muted-foreground">{t("playlistId")}</h3>
            <p className="font-medium">{playlist._id}</p>
          </div>

          {/* Songs */}
          <div>
            <h3 className="text-sm text-muted-foreground">{t("sampleSongs")}</h3>

            {!songs && <p className="text-sm text-muted-foreground">{t("loadingSongs")}</p>}

            {songs && songs.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("noSongs")}</p>
            )}

            {songs && songs.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("title")}</TableHead>
                    <TableHead>{t("artist")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead>{t("link")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songs.map((song) =>
                    song ? (
                      <TableRow key={song._id}>
                        <TableCell>{song.title}</TableCell>
                        <TableCell>{song.artist}</TableCell>
                        <TableCell>{song.category}</TableCell>
                        <TableCell>
                          <a
                            href={song.ytLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ) : null
                  )}
                </TableBody>
              </Table>
            )}

            {/* Link do pełnej playlisty */}
            <div className="mt-2">
              <Link href="/playlists" className="text-sm text-blue-600 hover:underline">
                {t("seeFullPlaylist")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}