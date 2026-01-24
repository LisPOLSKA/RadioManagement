"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ExceptionDialog from "./ExceptionDialog";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

export default function ExceptionsList() {
  const [editing, setEditing] = useState<Doc<"exceptions"> | null>(null);
  const [filterGroup, setFilterGroup] = useState<Id<"scheduleGroups"> | "">("");

  const { results: exceptions, status, loadMore } = usePaginatedQuery(
    api.exceptions.getExceptions,
    { groupId: filterGroup || undefined },
    { initialNumItems: 20 }
  );

  const { results: groups } = usePaginatedQuery(api.schedules.getSchedules, {}, { initialNumItems: 50 });

  const deleteMutation = useMutation(api.exceptions.deleteException);

  const t = useTranslations("Errors");
  const tUI = useTranslations("UI");

  const handleDelete = async (id: Id<"exceptions">) => {
    if (!confirm(tUI("sureExceptionDelete"))) return;
    try {
      await deleteMutation({ exceptionId: id });
      toast.success(tUI("deleted"));
    } catch(e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to delete exception");
        console.error(e);
      }
    }
  };

  const filtered = filterGroup ? exceptions.filter(ex => ex.groupId === filterGroup) : exceptions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{tUI("exceptionsList")}</h1>
        <ExceptionDialog groups={groups} key={"1234"}/>
      </div>

        <div className="flex gap-2 items-center">
            <span>{tUI("filterByScheduleGroup")}</span>
            <Select
                value={filterGroup || "All"}
                onValueChange={v => setFilterGroup(v === "All" ? "" : v as Id<"scheduleGroups">)}
            >
                <SelectTrigger className="w-48">
                    <SelectValue placeholder={tUI("allGroups")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">{tUI("allGroups")}</SelectItem>
                    {groups.map(g => (
                        <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tUI("action")}</TableHead>
              <TableHead>{tUI("title")}</TableHead>
              <TableHead>{tUI("startDate")}</TableHead>
              <TableHead>{tUI("endDate")}</TableHead>
              <TableHead>{tUI("dayOfWeek")}</TableHead>
              <TableHead>{tUI("priority")}</TableHead>
              <TableHead className="text-right">{tUI("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && status === "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">{tUI("loading")}</TableCell>
              </TableRow>
            )}

            {filtered.length === 0 && status !== "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">{tUI("noExceptions")}</TableCell>
              </TableRow>
            )}

            {filtered.map(ex => (
              <TableRow key={ex._id}>
                <TableCell>{ex.action}</TableCell>
                <TableCell>{ex.title || ex.eventId || "-"}</TableCell>
                <TableCell>{new Date(ex.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(ex.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                    {ex.dayOfWeek && ex.dayOfWeek.length > 0
                        ? ex.dayOfWeek.sort().map(d => [tUI("mon"),tUI("tue"),tUI("wed"),tUI("thu"),tUI("fri"),tUI("sat"),tUI("sun")][d]).join(", ")
                        : "-"}
                </TableCell>
                <TableCell>{ex.priority ?? "-"}</TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(ex)}>{tUI("edit")}</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(ex._id)}>{tUI("delete")}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(20)}>{tUI("loadMore")}</Button>
        </div>
      )}

      {editing && (
        <ExceptionDialog groups={groups} exception={editing} onClose={() => setEditing(null)} hideTrigger />
      )}
    </div>
  );
}