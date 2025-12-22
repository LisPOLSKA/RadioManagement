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

  const handleDelete = async (id: Id<"exceptions">) => {
    if (!confirm("Delete this exception?")) return;
    try {
      await deleteMutation({ exceptionId: id });
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const filtered = filterGroup ? exceptions.filter(ex => ex.groupId === filterGroup) : exceptions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Exceptions List</h1>
        <ExceptionDialog groups={groups} key={"1234"}/>
      </div>

        <div className="flex gap-2 items-center">
            <span>Filter by Schedule Group:</span>
            <Select
                value={filterGroup || "All"}
                onValueChange={v => setFilterGroup(v === "All" ? "" : v as Id<"scheduleGroups">)}
            >
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All groups</SelectItem>
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
              <TableHead>Action</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Day of Week</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && status === "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            )}

            {filtered.length === 0 && status !== "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No exceptions</TableCell>
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
                        ? ex.dayOfWeek.map(d => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ")
                        : "-"}
                </TableCell>
                <TableCell>{ex.priority ?? "-"}</TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(ex)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(ex._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(20)}>Load more</Button>
        </div>
      )}

      {editing && (
        <ExceptionDialog groups={groups} exception={editing} onClose={() => setEditing(null)} hideTrigger />
      )}
    </div>
  );
}