"use client";

import { useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Doc, Id } from "@/convex/_generated/dataModel";
import ActionSelect from "./ActionSelect";
import TargetTableSelect from "./TargetTableSelect";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

export default function LogsList() {
  const [action, setAction] = useState<string | undefined>();
  const [targetTable, setTargetTable] = useState<string | undefined>();
  const [targetId, setTargetId] = useState("");
  const [userInput, setUserInput] = useState(""); 
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>();
  const [cleanupDays, setCleanupDays] = useState<15 | 30 | 60 | 90>(30);
  const [filtersOpen, setFiltersOpen] = useState(true); // collapse toggle

  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");

  const lookedUpUser = useQuery(
    api.users.findUserById,
    userInput.trim() ? { userId: userInput.trim() } : "skip"
  );

  if (lookedUpUser?._id && lookedUpUser._id !== selectedUserId) {
    setSelectedUserId(lookedUpUser._id);
  }

  const t = useTranslations("UI");
  const deleteOldLogs = useMutation(api.logs.deleteLogsOlderThan);

  const {
    results: logs,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.logs.getLogs,
    user && user.role >= 2
      ? {
          action,
          targetTable,
          targetId: targetId.trim() || undefined,
          userId: selectedUserId || undefined,
        }
      : "skip",
    { initialNumItems: 20 }
  );

  if (user && user.role < 2) {
    return <h1 className="text-red-500">{t("unauthorized")}</h1>;
  }

  async function handleCleanupLogs() {
    if (!confirm(t("deleteLogsConfirm", { days: cleanupDays }))) {
      return;
    }

    try {
      const result = await deleteOldLogs({ olderThanDays: cleanupDays });
      toast.success(`${t("logsDeleted")}: ${result.deletedCount}`);
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error(t(error.data));
      } else {
        toast.error("Failed to delete old logs");
        console.error(error);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">{t("logs")}</h1>

        {user?.role === 4 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={String(cleanupDays)} onValueChange={(value) => setCleanupDays(Number(value) as 15 | 30 | 60 | 90)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("deleteLogsOlderThan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 {t("days")}</SelectItem>
                <SelectItem value="30">30 {t("days")}</SelectItem>
                <SelectItem value="60">60 {t("days")}</SelectItem>
                <SelectItem value="90">90 {t("days")}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="destructive" onClick={handleCleanupLogs}>
              {t("deleteOldLogs")}
            </Button>
          </div>
        )}
      </div>

      {/* Filters panel */}
      <div className="border rounded-md p-2">
        <button
          className="flex justify-between w-full font-medium mb-2"
          onClick={() => setFiltersOpen(prev => !prev)}
        >
          <span>{t("filters")}</span>
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtersOpen && (
          <div className="flex flex-wrap gap-4">
            <ActionSelect value={action} onChange={setAction} />
            <TargetTableSelect value={targetTable} onChange={setTargetTable} />

            <Input
              placeholder={t("targetId")}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-64"
            />
            <Input
              placeholder={t("userId")}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-64"
            />

            <Button variant="outline" size="sm" onClick={() => {
              setAction(undefined);
              setTargetTable(undefined);
              setTargetId("");
              setUserInput("");
              setSelectedUserId(undefined);
            }}>
              {t("resetFilters")}
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("target")}</TableHead>
              <TableHead>{t("doneBy")}</TableHead>
              <TableHead>{t("details")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.length === 0 && status === "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("loadingLogs")}
                </TableCell>
              </TableRow>
            )}

            {logs.length === 0 && status !== "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("noLogsFound")}
                </TableCell>
              </TableRow>
            )}

            {logs.map((log: Doc<"logs">) => (
              <TableRow key={log._id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono">{log.action}</TableCell>
                <TableCell>
                  {log.targetTable ?? "-"}
                  {log.targetId && (
                    <div className="text-xs text-muted-foreground">{log.targetId}</div>
                  )}
                </TableCell>
                <TableCell>{log.createdBy}</TableCell>
                <TableCell className="max-w-md truncate">{log.details ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(10)}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}