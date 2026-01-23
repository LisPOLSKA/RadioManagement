"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SelectedScheduleDialog from "./SelectedScheduleDialog";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";

export default function SelectedSchedulesList() {
    const [editing, setEditing] = useState<Doc<"selectedSchedules"> | null>(null);

    const { results, status, loadMore } = usePaginatedQuery(api.schedules.getSelectedSchedules, {}, { initialNumItems: 20 });
    const deleteMutation = useMutation(api.schedules.deleteSelectedSchedule);

    const t = useTranslations("Errors");

    const handleDelete = async (id: Id<"selectedSchedules">) => {
        if (!confirm("Delete this selected schedule?")) return;
        try {
            await deleteMutation({ selectedScheduleId: id });
            toast.success("Deleted");
        } catch(e) {
            if (e instanceof ConvexError) {
                toast.error(t(e.data));
            } else {
                toast.error("Failed to delete selected schedule");
                console.error(e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Selected Schedules</h1>
                <SelectedScheduleDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.length === 0 && status === "LoadingFirstPage" && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">Loading…</TableCell>
                            </TableRow>
                        )}

                        {results.length === 0 && status !== "LoadingFirstPage" && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">No selected schedules</TableCell>
                            </TableRow>
                        )}
                            

                        {results.map(ss => (
                            <TableRow key={ss._id}>
                                <TableCell>{ss.scheduleName}</TableCell>
                                <TableCell>{ss.priority}</TableCell>
                                <TableCell>{ss.startDate ? new Date(ss.startDate).toLocaleString() : "-"}</TableCell>
                                <TableCell>{ss.endDate ? new Date(ss.endDate).toLocaleString() : "-"}</TableCell>
                                <TableCell>{ss.schedule?.sort().map(i => ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]).join(", ") || "-"}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setEditing(ss)}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(ss._id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {status === "CanLoadMore" && (
                <div className="flex justify-center">
                    <Button variant="outline" onClick={() => loadMore(10)}>Load more</Button>
                </div>
            )}

            {editing && (
                <SelectedScheduleDialog selectedSchedule={editing} onClose={() => setEditing(null)} hideTrigger />
            )}
        </div>
    );
}