"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Props = {
  groups: Doc<"scheduleGroups">[];
  exception?: Doc<"exceptions">;
  onClose?: () => void;
  hideTrigger?: boolean;
};

export default function ExceptionDialog({ groups, exception, onClose, hideTrigger = false }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<Id<"scheduleGroups"> | "">(exception?.groupId || "");
  const [title, setTitle] = useState(exception?.title || "");
  const [action, setAction] = useState(exception?.action || "SKIP_DAY");
  const [startDate, setStartDate] = useState(exception ? new Date(exception.startDate).toISOString().slice(0,10) : "");
  const [daysSelected, setDaysSelected] = useState<number[]>(
    exception?.dayOfWeek || []
  );
  const [eventId, setEventId] = useState<Id<"scheduleEvents"> | undefined>(exception?.eventId || undefined);
  const [endDate, setEndDate] = useState(exception ? new Date(exception.endDate).toISOString().slice(0,10) : "");
  const [priority, setPriority] = useState(exception?.priority ?? 0);
  const [startHour, setStartHour] = useState<number>(exception?.startHour ?? 0);
  const [endHour, setEndHour] = useState<number>(exception?.endHour ?? 0);
  const [endMinute, setEndMinute] = useState<number>(exception?.endMinute ?? 0);
  const [startMinute, setStartMinute] = useState<number>(exception?.startMinute ?? 0);


  const schedule = useQuery(api.schedules.getSchedule, selectedGroup ? { groupId: selectedGroup } : "skip");

  const upsert = useMutation(api.exceptions.upsertException);
  const allDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!selectedGroup) {
            toast.error("Select a schedule group");
            return;
        }
        try {
            await upsert({
                exceptionId: exception?._id,
                groupId: selectedGroup,
                action,
                eventId: (action === "SKIP_EVENT" || action === "MODIFY_EVENT") ? eventId : undefined,
                startDate: new Date(startDate).getTime(),
                endDate: new Date(endDate).getTime(),
                dayOfWeek: daysSelected, // <-- wszystkie wybrane
                priority,
                startHour: action === "MODIFY_EVENT" ? startHour : undefined,
                startMinute: action === "MODIFY_EVENT" ? startMinute : undefined,
                endHour: action === "MODIFY_EVENT" ? endHour : undefined,
                endMinute: action === "MODIFY_EVENT" ? endMinute : undefined,
                title,
            });
            toast.success("Exception saved");
            if (!exception) {
                setSelectedGroup("");
                setAction("SKIP_DAY");
                setEventId(undefined);
                setStartDate("");
                setEndDate("");
                setDaysSelected([]);
                setPriority(0);
                setStartHour(0);
                setStartMinute(0);
                setEndHour(0);
                setEndMinute(0);
                setTitle("");
            }
            onClose?.();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save");
        }
    };

    function handleEventChange(eId: Id<"scheduleEvents">) {
        setEventId(eId);

        if (action === "MODIFY_EVENT" && schedule?.events) {
            const selectedEvent = schedule.events.find(ev => ev._id === eId);
            if (selectedEvent) {
            setStartHour(selectedEvent.startHour ?? 0);
            setStartMinute(selectedEvent.startMinute ?? 0);
            setEndHour(selectedEvent.endHour ?? 0);
            setEndMinute(selectedEvent.endMinute ?? 0);
            }
        }
    }

    function toggleDay(day: number) {
        setDaysSelected(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    }

  return (
    <Dialog open={!!exception || undefined} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogTrigger asChild hidden={hideTrigger}>
        <Button>{exception ? "Edit Exception" : "Add Exception"}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{exception ? "Edit" : "New"} Exception</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label>Schedule Group</Label>
            <Select 
                value={selectedGroup || "all"} 
                onValueChange={v => setSelectedGroup(v === "all" ? "" : (v as Id<"scheduleGroups">))}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    {groups.map(g => (
                        <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"/>
          </div>

          <div className="grid gap-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={v => setAction(v as "SKIP_DAY" | "SKIP_EVENT" | "MODIFY_EVENT")}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SKIP_DAY">Skip Day</SelectItem>
                    <SelectItem value="SKIP_EVENT">Skip Event</SelectItem>
                    <SelectItem value="MODIFY_EVENT">Modify Event</SelectItem>
                </SelectContent>
            </Select>
          </div>

            {(action === "SKIP_EVENT" || action === "MODIFY_EVENT") && (
                <div className="grid gap-2">
                    <Label>Event</Label>
                    <Select value={eventId || undefined} onValueChange={v => handleEventChange(v as Id<"scheduleEvents">)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                            {schedule?.events.map(e => (
                                <SelectItem key={e._id} value={e._id}>{e.startHour}:{e.startMinute} - {e.endHour}:{e.endMinute}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {action === "MODIFY_EVENT" && (
                <div className="grid gap-2">
                    <Label>Start Time</Label>
                    <Input type="number" min={0} max={23} value={startHour} onChange={e => setStartHour(Number(e.target.value))} placeholder="Hour" />
                    <Input type="number" min={0} max={59} value={startMinute} onChange={e => setStartMinute(Number(e.target.value))} placeholder="Minute" />

                    <Label>End Time</Label>
                    <Input type="number" min={0} max={23} value={endHour} onChange={e => setEndHour(Number(e.target.value))} placeholder="Hour" />
                    <Input type="number" min={0} max={59} value={endMinute} onChange={e => setEndMinute(Number(e.target.value))} placeholder="Minute" />
                </div>
            )}

          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

            <div className="grid gap-2">
                <Label>Days of week</Label>
                <div className="flex gap-2">
                    {allDays.map((d, i) => (
                    <Button
                        key={i}
                        size="sm"
                        variant={daysSelected.includes(i) ? "default" : "outline"}
                        onClick={(e) => { e.preventDefault(); toggleDay(i); }}
                    >
                        {d}
                    </Button>
                    ))}
                </div>
            </div>

          <div className="grid gap-2">
            <Label>Priority</Label>
            <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
          </div>

          <DialogFooter>
            <Button type="submit">{exception ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}