"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type EventForm = {
    id?: Id<"scheduleEvents">;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    error?: string;
};

type Props = {
    schedule?: Doc<"scheduleGroups">;
    onClose?: () => void;
    hideTrigger?: boolean;
};

export default function ScheduleDialog({ schedule, onClose, hideTrigger }: Props) {
    const scheduleData = useQuery(
        api.schedules.getSchedule,
        schedule ? { groupId: schedule._id } : "skip"
    );

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [events, setEvents] = useState<EventForm[]>([]);
    const [initialized, setInitialized] = useState(false);

    const upsertSchedule = useMutation(api.schedules.upsertSchedule);

    useEffect(() => {
        if (scheduleData && !initialized) {
            setName(scheduleData.name);
            setDescription(scheduleData.description);
            setEvents(
                scheduleData.events.map(ev => ({
                    id: ev._id,
                    startHour: ev.startHour,
                    startMinute: ev.startMinute,
                    endHour: ev.endHour,
                    endMinute: ev.endMinute
                }))
            );
            setInitialized(true);
        }
    }, [scheduleData, initialized]);

    const addEvent = () => {
        setEvents(prev => [
            ...prev,
            { startHour: 8, startMinute: 0, endHour: 8, endMinute: 5 }
        ]);
    };

    const updateEvent = (i: number, field: keyof EventForm, value: number | "") => {
        setEvents(prev => {
            const newEvents = prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e));

            // Walidacja godzin/minut
            const ev = newEvents[i];
            let error = "";
            if (typeof ev.startHour === "number" && (ev.startHour < 0 || ev.startHour > 23)) {
                error = "Start hour must be 0-23";
            } else if (typeof ev.endHour === "number" && (ev.endHour < 0 || ev.endHour > 23)) {
                error = "End hour must be 0-23";
            } else if (typeof ev.startMinute === "number" && (ev.startMinute < 0 || ev.startMinute > 59)) {
                error = "Start minute must be 0-59";
            } else if (typeof ev.endMinute === "number" && (ev.endMinute < 0 || ev.endMinute > 59)) {
                error = "End minute must be 0-59";
            } else if (
                typeof ev.startHour === "number" &&
                typeof ev.startMinute === "number" &&
                typeof ev.endHour === "number" &&
                typeof ev.endMinute === "number"
            ) {
                const startTotal = ev.startHour * 60 + ev.startMinute;
                const endTotal = ev.endHour * 60 + ev.endMinute;
                if (startTotal >= endTotal) {
                    error = "Start must be before end";
                }
            }

            newEvents[i].error = error;
            return newEvents;
        });
    };

    const removeEvent = (i: number) => {
        setEvents(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async () => {
        try {
            const payload = events.map(ev => ({
                id: ev.id,
                startHour: ev.startHour,
                startMinute: ev.startMinute,
                endHour: ev.endHour,
                endMinute: ev.endMinute,
            }));

            await upsertSchedule({
                groupId: schedule?._id,
                name,
                description,
                events: payload,
            });
            toast.success("Schedule saved");
            onClose?.();
        } catch {
            toast.error("Failed to save schedule");
        }
    };

    return (
        <Dialog open={!!schedule || undefined} onOpenChange={o => !o && onClose?.()}>
            {!hideTrigger && (
                <DialogTrigger asChild>
                    <Button variant={"outline"}><Plus className="mr-2 h-4 w-4" />{schedule ? "Edit schedule" : "Add schedule"}</Button>
                </DialogTrigger>
            )}

            <DialogContent className="w-[min(90%,32rem)] sm:mx-auto max-h-[90vh] overflow-y-auto p-4">
                <DialogHeader>
                    <DialogTitle>{schedule ? "Edit schedule" : "New schedule"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="mb-1">Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div>
                        <Label className="mb-1">Description</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Events</Label>
                            <Button size="sm" onClick={addEvent}>+ Add break</Button>
                        </div>

                        {events.map((ev, i) => (
                            <div key={i} className="flex gap-2 items-center flex-col">
                                <div className="flex gap-2 items-center">
                                    <Input type="number" value={ev.startHour} onChange={e => updateEvent(i, "startHour", +e.target.value)} min={0} max={23} />
                                    :
                                    <Input type="number" value={ev.startMinute} onChange={e => updateEvent(i, "startMinute", +e.target.value)} min={0} max={59} />
                                    →
                                    <Input type="number" value={ev.endHour} onChange={e => updateEvent(i, "endHour", +e.target.value)} min={0} max={23} />
                                    :
                                    <Input type="number" value={ev.endMinute} onChange={e => updateEvent(i, "endMinute", +e.target.value)} min={0} max={59} />
                                    <Button variant="ghost" size="sm" onClick={() => removeEvent(i)}>✕</Button>
                                </div>
                                {ev.error && <p className="text-red-500 text-sm">{ev.error}</p>}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={events.some(e => e.error)}>Save</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
