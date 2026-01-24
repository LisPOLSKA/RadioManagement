"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export default function SchedulePreview({hideDebug = false}: {hideDebug?: boolean}) {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const timestamp = new Date(date).setHours(0, 0, 0, 0);

  const data = useQuery(api.schedules.getAdminSchedule, {
    date: timestamp,
  });

  const t = useTranslations("UI");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("checkSchedule")}</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      {/* Schedule meta */}
      <div className="text-sm text-muted-foreground">
        {data === undefined && t("loadingSchedule")}
        {data && !data.schedule && t("noSchedule")}
      </div>

      {/* EVENTS TABLE */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("start")}</TableHead>
              <TableHead>{t("end")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data && data.events.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {t("noEvents")}
                </TableCell>
              </TableRow>
            )}

            {data?.events.map((event, i) => (
              <TableRow key={i}>
                <TableCell>
                  {String(event.startHour).padStart(2, "0")}:
                  {String(event.startMinute).padStart(2, "0")}
                </TableCell>

                <TableCell>
                  {String(event.endHour).padStart(2, "0")}:
                  {String(event.endMinute).padStart(2, "0")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* RAW DEBUG (opcjonalne, ale admin-friendly) */}
      {data && hideDebug === false && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">{t("rawResponse")}</summary>
          <pre className="mt-2 bg-muted rounded p-3 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}