"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus } from "lucide-react";

type Props = {
  selectedSchedule?: Doc<"selectedSchedules">;
  onClose?: () => void;
  hideTrigger?: boolean;
};

export default function SelectedScheduleDialog({ selectedSchedule, onClose, hideTrigger = false }: Props) {
  const [scheduleId, setScheduleId] = useState<Id<"scheduleGroups"> | "">(selectedSchedule?.scheduleId || "");
  const [priority, setPriority] = useState(selectedSchedule?.priority || 0);
  const [startDate, setStartDate] = useState(selectedSchedule?.startDate ? new Date(selectedSchedule.startDate).toISOString().slice(0,10) : "");
  const [endDate, setEndDate] = useState(selectedSchedule?.endDate ? new Date(selectedSchedule.endDate).toISOString().slice(0,10) : "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(selectedSchedule?.schedule || []);

  const { results: schedules, status, loadMore } = usePaginatedQuery(api.schedules.getSchedules, {}, { initialNumItems: 20 });
  const upsert = useMutation(api.schedules.upsertSelectedSchedule);

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleDay = (i: number) => {
    if (daysOfWeek.includes(i)) setDaysOfWeek(daysOfWeek.filter(d => d !== i));
    else setDaysOfWeek([...daysOfWeek, i]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!scheduleId) {
      toast.error("Select a schedule");
      return;
    }

    try {
      await upsert({
        selectedScheduleId: selectedSchedule?._id,
        scheduleId,
        priority,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() : undefined,
        schedule: daysOfWeek,
      });
      toast.success("Selected schedule saved");
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }
  };

  return (
    <Dialog open={!!selectedSchedule || undefined} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogTrigger asChild hidden={hideTrigger}>
        <Button variant={"outline"}><Plus className="mr-2 h-4 w-4" />{selectedSchedule ? "Edit Selected Schedule" : "Add Selected Schedule"}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedSchedule ? "Edit" : "New"} Selected Schedule</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={handleSubmit}>
          {/* Wybór schedule */}
          <div className="grid gap-2">
            <Label>Schedule</Label>
            <Select value={scheduleId} onValueChange={(v: Id<"scheduleGroups">) => setScheduleId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(s => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
                {status === "CanLoadMore" && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => loadMore(20)}>Load more</Button>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priorytet */}
          <div className="grid gap-2">
            <Label>Priority</Label>
            <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
          </div>

          {/* Daty */}
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          {/* Dni tygodnia */}
          <div className="grid gap-2">
            <Label>Days of week</Label>
            <div className="flex gap-2 flex-wrap">
              {allDays.map((d, i) => (
                <Button key={i} size="sm" variant={daysOfWeek.includes(i) ? "default" : "outline"} onClick={(e) => { e.preventDefault(); toggleDay(i); }}>
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">{selectedSchedule ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
