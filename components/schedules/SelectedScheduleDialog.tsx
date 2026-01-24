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
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

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

  const t = useTranslations("Errors");
  const tUI = useTranslations("UI");

  const allDays = [tUI("mon"), tUI("tue"), tUI("wed"), tUI("thu"), tUI("fri"), tUI("sat"), tUI("sun")];

  const toggleDay = (i: number) => {
    if (daysOfWeek.includes(i)) setDaysOfWeek(daysOfWeek.filter(d => d !== i));
    else setDaysOfWeek([...daysOfWeek, i]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!scheduleId) {
      toast.error(tUI("selectSchedule"));
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
      toast.success(tUI("selectedScheduleSaved"));
      onClose?.();
    } catch(e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to save selected schedule");
        console.error(e);
      }
    }
  };

  return (
    <Dialog open={!!selectedSchedule || undefined} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogTrigger asChild hidden={hideTrigger}>
        <Button variant={"outline"}><Plus className="mr-2 h-4 w-4" />{selectedSchedule ? tUI("editSelectedSchedule") : tUI("addSelectedSchedule")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedSchedule ? tUI("edit") : tUI("new")} Selected Schedule</DialogTitle>
            <p className="text-sm text-gray-500 mb-2">
              {tUI("onlySupervisorsSelectedSchedules")}
            </p>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={handleSubmit}>
          {/* Wybór schedule */}
          <div className="grid gap-2">
            <Label>Schedule</Label>
            <Select value={scheduleId} onValueChange={(v: Id<"scheduleGroups">) => setScheduleId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tUI("selectSchedule")} />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(s => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
                {status === "CanLoadMore" && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => loadMore(20)}>{tUI("loadMore")}</Button>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priorytet */}
          <div className="grid gap-2">
            <Label>{tUI("priority")}</Label>
            <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
          </div>

          {/* Daty */}
          <div className="grid gap-2">
            <Label>{tUI("startDate")}</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required/>
          </div>
          <div className="grid gap-2">
            <Label>{tUI("endDate")}</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required/>
          </div>

          {/* Dni tygodnia */}
          <div className="grid gap-2">
            <Label>{tUI("daysOfWeek")}</Label>
            <div className="flex gap-2 flex-wrap">
              {allDays.map((d, i) => (
                <Button key={i} size="sm" variant={daysOfWeek.includes(i) ? "default" : "outline"} onClick={(e) => { e.preventDefault(); toggleDay(i); }}>
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">{selectedSchedule ? tUI("save") : tUI("create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
