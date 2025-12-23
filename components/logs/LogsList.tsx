"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
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
import { useAuth } from "@clerk/nextjs";

export default function LogsList() {
  const [action, setAction] = useState<string | undefined>();
  const [targetTable, setTargetTable] = useState<string | undefined>();
  const [targetId, setTargetId] = useState("");
  const [userInput, setUserInput] = useState(""); // input jako string
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>(); // ID dla Convex

  const { userId: clerkId } = useAuth();

  // Pobranie aktualnego użytkownika i jego roli
  const user = useQuery(api.users.getUser, clerkId ? { clerkId: clerkId } : "skip");

  // Pobranie usera po ID wprowadzonego w polu
  const lookedUpUser = useQuery(
    api.users.findUserById,
    userInput.trim() ? { userId: userInput.trim() } : "skip"
  );

  // Kiedy `lookedUpUser` się pojawi, ustawiamy ID do filtrowania
  if (lookedUpUser?._id && lookedUpUser._id !== selectedUserId) {
    setSelectedUserId(lookedUpUser._id);
  }

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
    return <h1 className="text-red-500">Unauthorized</h1>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">Logs</h1>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <ActionSelect value={action} onChange={setAction} />
        <TargetTableSelect value={targetTable} onChange={setTargetTable} />

        {/* Target ID */}
        <Input
          placeholder="Target ID"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="w-64"
        />

        {/* User ID / input */}
        <Input
          placeholder="User ID"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Done By</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.length === 0 && status === "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading logs…
                </TableCell>
              </TableRow>
            )}

            {logs.length === 0 && status !== "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No logs found
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

      {/* Pagination */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(10)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}