"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ScheduleDialog from "./ScheduleDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

export default function SchedulesList() {
  const [editing, setEditing] = useState<Doc<"scheduleGroups"> | null>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.schedules.getSchedules,
    {},
    { initialNumItems: 20 }
  );

  const deleteSchedule = useMutation(api.schedules.deleteSchedule);
  const t = useTranslations("Errors");
  const tUI = useTranslations("UI");

  const handleDelete = async (id: Id<"scheduleGroups">) => {
    if (!confirm(tUI("sureScheduleDelete"))) return;

    try {
      await deleteSchedule({ groupId: id });
      toast.success(tUI("scheduleDeleted"));
    } catch (err: any) {
        if (err instanceof ConvexError) {
            console.log(err.data);
            toast.error(t(err.data));
        } else {
            toast.error("Unexpected error");
            console.error(err);
        }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{tUI("schedules")}</h1>
        <ScheduleDialog 
          key={"nothing"}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tUI("name")}</TableHead>
              <TableHead>{tUI("description")}</TableHead>
              <TableHead className="text-right">{tUI("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {results.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.description}</TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                    {tUI("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(s._id)}
                  >
                    {tUI("delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {tUI("noSchedulesFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(10)}>
            {tUI("loadMore")}
          </Button>
        </div>
      )}

        {editing && (
            <ScheduleDialog
                key={editing._id}   // 🔥 KLUCZ
                schedule={editing}
                onClose={() => setEditing(null)}
                hideTrigger
            />
        )}
    </div>
  );
}
