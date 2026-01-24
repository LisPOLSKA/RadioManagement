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
import { Plus } from "lucide-react";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

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
  const [daysSelected, setDaysSelected] = useState<number[]>(exception?.dayOfWeek || []);
  const [eventId, setEventId] = useState<Id<"scheduleEvents"> | undefined>(exception?.eventId || undefined);
  const [endDate, setEndDate] = useState(exception ? new Date(exception.endDate).toISOString().slice(0,10) : "");
  const [priority, setPriority] = useState(exception?.priority ?? 0);
  const [startHour, setStartHour] = useState<number>(exception?.startHour ?? 0);
  const [endHour, setEndHour] = useState<number>(exception?.endHour ?? 0);
  const [endMinute, setEndMinute] = useState<number>(exception?.endMinute ?? 0);
  const [startMinute, setStartMinute] = useState<number>(exception?.startMinute ?? 0);

  const tUI = useTranslations("UI");

  const schedule = useQuery(api.schedules.getSchedule, selectedGroup ? { groupId: selectedGroup } : "skip");
  const upsert = useMutation(api.exceptions.upsertException);
  const allDays = [tUI("mon"), tUI("tue"), tUI("wed"), tUI("thu"), tUI("fri"), tUI("sat"), tUI("sun")];

  const t = useTranslations("Errors");

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedGroup) {
      toast.error(tUI("selectSchedule"));
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
        dayOfWeek: daysSelected,
        priority,
        startHour: action === "MODIFY_EVENT" ? startHour : undefined,
        startMinute: action === "MODIFY_EVENT" ? startMinute : undefined,
        endHour: action === "MODIFY_EVENT" ? endHour : undefined,
        endMinute: action === "MODIFY_EVENT" ? endMinute : undefined,
        title,
      });
      toast.success(tUI("exceptionSaved"));
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
    } catch(e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to save exception");
        console.error(e);
      }
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
    setDaysSelected(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  return (
    <Dialog open={!!exception || undefined} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogTrigger asChild hidden={hideTrigger}>
        <Button variant={"outline"}>
          <Plus className="mr-2 h-4 w-4" />
          {exception ? tUI("editException") : tUI("addException")}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(90%,32rem)] sm:mx-auto max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{exception ? tUI("editException") : tUI("addException")}</DialogTitle>
            <p className="text-sm text-gray-500 mb-2">
              {tUI("onlySupervisorsExceptions")}
            </p>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={handleSubmit}>
          {/* Schedule Group */}
          <div className="grid gap-2 w-full">
            <Label>{tUI("schedule")}</Label>
            <Select value={selectedGroup || "all"} onValueChange={v => setSelectedGroup(v === "all" ? "" : (v as Id<"scheduleGroups">))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tUI("selectSchedule")} />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="all">{tUI("allSchedules")}</SelectItem>
                {groups.map(g => <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="grid gap-2 w-full">
            <Label>{tUI("title")}</Label>
            <Input className="w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder={tUI("title")} />
          </div>

          {/* Action */}
          <div className="grid gap-2 w-full">
            <Label>{tUI("action")}</Label>
            <Select value={action} onValueChange={v => setAction(v as "SKIP_DAY" | "SKIP_EVENT" | "MODIFY_EVENT")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tUI("selectAction")} />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="SKIP_DAY">{tUI("skipDay")}</SelectItem>
                <SelectItem value="SKIP_EVENT">{tUI("skipEvent")}</SelectItem>
                <SelectItem value="MODIFY_EVENT">{tUI("modifyEvent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event */}
          {(action === "SKIP_EVENT" || action === "MODIFY_EVENT") && (
            <div className="grid gap-2 w-full">
              <Label>{tUI("event")}</Label>
              <Select value={eventId || undefined} onValueChange={v => handleEventChange(v as Id<"scheduleEvents">)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tUI("selectEvent")} />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {schedule?.events?.map(e => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.startHour}:{e.startMinute} - {e.endHour}:{e.endMinute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Modify Event Time */}
          {action === "MODIFY_EVENT" && (
            <div className="grid gap-2 w-full">
              <Label>{tUI("startTime")}</Label>
              <div className="flex gap-2 flex-wrap">
                <Input className="w-20 shrink-0" type="number" min={0} max={23} value={startHour} onChange={e => setStartHour(Number(e.target.value))} placeholder={tUI("hour")} />
                <Input className="w-20 shrink-0" type="number" min={0} max={59} value={startMinute} onChange={e => setStartMinute(Number(e.target.value))} placeholder={tUI("minute")} />
              </div>

              <Label>{tUI("endTime")}</Label>
              <div className="flex gap-2 flex-wrap">
                <Input className="w-20 shrink-0" type="number" min={0} max={23} value={endHour} onChange={e => setEndHour(Number(e.target.value))} placeholder={tUI("hour")} />
                <Input className="w-20 shrink-0" type="number" min={0} max={59} value={endMinute} onChange={e => setEndMinute(Number(e.target.value))} placeholder={tUI("minute")} />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid gap-2 w-full sm:grid-cols-2">
            <div className="w-full">
              <Label>{tUI("startDate")}</Label>
              <Input className="w-full" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="w-full">
              <Label>{tUI("endDate")}</Label>
              <Input className="w-full" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Days of week */}
          <div className="grid gap-2 w-full">
            <Label>{tUI("daysOfWeek")}</Label>
            <div className="flex flex-wrap gap-2">
              {allDays.map((d, i) => (
                <Button
                  key={i}
                  size="sm"
                  className="shrink-0"
                  variant={daysSelected.includes(i) ? "default" : "outline"}
                  onClick={(e) => { e.preventDefault(); toggleDay(i); }}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="grid gap-2 w-full">
            <Label>{tUI("priority")}</Label>
            <Input className="w-full" type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
          </div>

          <DialogFooter>
            <Button type="submit">{exception ? tUI("save") : tUI("create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
