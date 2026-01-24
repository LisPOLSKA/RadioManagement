"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

type Props = {
    selectedPlaylist?: Doc<"selectedPlaylists">;
    onClose?: () => void;
    hideTrigger?: boolean;
};

export default function SelectedPlaylistDialog({ selectedPlaylist, onClose, hideTrigger = false }: Props) {
    const [playlistId, setPlaylistId] = useState<Id<"playlists"> | "">(
        selectedPlaylist?.playlistId || ""
    );
    const [priority, setPriority] = useState(selectedPlaylist?.priority || 0);
    const [startDate, setStartDate] = useState(
        selectedPlaylist?.startDate ? new Date(selectedPlaylist.startDate).toISOString().substring(0, 10) : ""
    );
    const [endDate, setEndDate] = useState(
        selectedPlaylist?.endDate ? new Date(selectedPlaylist.endDate).toISOString().substring(0, 10) : ""
    );
    const [schedule, setSchedule] = useState<number[]>(selectedPlaylist?.schedule || []);

    // Paginated query
    const { results: playlists, status, loadMore } = usePaginatedQuery(
        api.playlists.getPlaylists,
        {},
        { initialNumItems: 20 }
    );

    const upsertSP = useMutation(api.playlists.upsertSelectedPlaylist);

    const t = useTranslations("Errors");
    const tUI = useTranslations("UI");

    const daysOfWeek = [tUI("mon"), tUI("tue"), tUI("wed"), tUI("thu"), tUI("fri"), tUI("sat"), tUI("sun")];

    const toggleDay = (index: number) => {
        if (schedule.includes(index)) setSchedule(schedule.filter(d => d !== index));
        else setSchedule([...schedule, index]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playlistId) {
            toast.error(tUI("selectPlaylist"));
            return;
        }

        if(!startDate || !endDate) {
            toast.error(tUI("startEndSelectedPlaylistError"));
            return;
        }

        try {
            await upsertSP({
                selectedPlaylistId: selectedPlaylist?._id,
                playlistId,
                priority,
                startDate: new Date(startDate).getTime(),
                endDate: new Date(endDate).getTime(),
                schedule
            });
            toast.success(tUI("savedSuccessfully"));
            onClose?.();
        } catch(e) {
            if (e instanceof ConvexError) {
                toast.error(t(e.data));
            } else {
                toast.error("Failed to save selected playlist");
                console.error(e);
            }
        }
    };

    return (
        <Dialog open={!!selectedPlaylist || undefined} onOpenChange={(open) => { if (!open) onClose?.() }}>
            <DialogTrigger asChild hidden={hideTrigger}>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    {selectedPlaylist ? tUI("editSelectedPlaylist") : tUI("addSelectedPlaylist")}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{selectedPlaylist ? tUI("editSelectedPlaylist") : tUI("addSelectedPlaylist")}</DialogTitle>
                    <p className="text-sm text-gray-500 mb-2">
                        {tUI("onlySupervisors")}
                    </p>
                </DialogHeader>

                <form className="grid gap-4 py-2" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        <Label>{tUI("playlist")}</Label>
                        <Select value={playlistId} onValueChange={(v: Id<"playlists">) => setPlaylistId(v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={tUI("selectPlaylist")} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                {playlists.map(pl => (
                                    <SelectItem key={pl._id} value={pl._id}>{pl.title}</SelectItem>
                                ))}
                                {status === "CanLoadMore" && (
                                    <div className="p-2 sticky bottom-0 bg-background">
                                        <Button variant="ghost" size="sm" onClick={() => loadMore(20)} className="w-full">{tUI("loadMore")}</Button>
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>{tUI("priority")}</Label>
                        <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
                    </div>

                    <div className="grid gap-2">
                        <Label>{tUI("startDate")}</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label>{tUI("endDate")}</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>{tUI("daysOfWeek")}</Label>
                        <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((d, i) => (
                                <Button
                                    key={i}
                                    size="sm"
                                    variant={schedule.includes(i) ? "default" : "outline"}
                                    onClick={e => { e.preventDefault(); toggleDay(i); }}
                                >
                                    {d}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit">{selectedPlaylist ? tUI("save") : tUI("create")}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}