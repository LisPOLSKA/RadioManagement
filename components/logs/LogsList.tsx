"use client";

import { useState } from "react";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
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

import { Doc, Id } from "@/convex/_generated/dataModel";
import ActionSelect from "./ActionSelect";
import TargetTableSelect from "./TargetTableSelect";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LogsList() {
  const [action, setAction] = useState<string | undefined>();
  const [targetTable, setTargetTable] = useState<string | undefined>();
  const [targetId, setTargetId] = useState("");
  const [userInput, setUserInput] = useState(""); 
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>();
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("logs")}</h1>

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