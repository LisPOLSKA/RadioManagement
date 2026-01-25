"use client";

import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { toast } from "sonner";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { ConvexError } from "convex/values";
import UserCommentDialog from "./CommentDialog";

const ROLES = [
  { value: "0", label: "Banned" },
  { value: "1", label: "User" },
  { value: "2", label: "Supervisor" },
  { value: "3", label: "Admin" },
  { value: "4", label: "Super admin" },
];

export default function UsersList() {
  const [search, setSearch] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const t = useTranslations("Errors");

  const { userId: clerkId } = useAuth();
  const me = useQuery(
    api.users.getUser,
    clerkId ? { clerkId } : "skip"
  );

  const {
    results: users,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.users.getUsers,
    me && me.role >= 2
      ? { 
        search: search.trim() || undefined ,
        searchUserId: searchUserId.trim() || undefined
      }
      : "skip",
    { initialNumItems: 20 }
  );

  const setRole = useMutation(api.users.setUserRole);

  const tUI = useTranslations("UI");

  if (me && me.role < 3) {
    return <h1 className="text-red-500">{tUI("unauthorized")}</h1>;
  }

  async function changeRole(userId: Doc<"users">["_id"], role: number) {
    try {
      await setRole({ userId, role });
      toast.success(tUI("roleUpdated"));
    } catch(e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error("Failed to update role");
        console.error(e);
      }
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    toast.success(tUI("userIdCopied"));
  }

  if(me === undefined) {
    return "Loading...";
  }else if(me === null){
    return <h1 className="text-red-500">{tUI("unauthorized")}</h1>;
  }

  function canAssignRole(meRole: number, targetUserRole: number, newRole: number) {
    if (meRole === 4) return true; // superadmin może wszystko
    if (meRole === 3) {
      // admin może zmieniać role użytkowników (0 lub 1) ale nie innych adminów ani superadminów
      if (targetUserRole >= 3) return false; // nie rusza adminów/superadminów
      return newRole <= 2; // może ustawiać max na 2 (admin)
    }
    return false; // inne role nie mogą nic zmieniać
  }


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{tUI("users")}</h1>

      <div className="flex gap-3 flex-wrap">
      {/* Search */}
        <Input
          placeholder={tUI("searchEmail")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <Input
          placeholder={tUI("searchUserId")}
          value={searchUserId}
          onChange={(e) => setSearchUserId(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tUI("userName")}</TableHead>
              <TableHead>{tUI("email")}</TableHead>
              <TableHead>{tUI("comment")}</TableHead>
              <TableHead>{tUI("role")}</TableHead>
              <TableHead>{tUI("userId")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {status === "LoadingFirstPage" && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {tUI("loadingUsers")}
                </TableCell>
              </TableRow>
            )}

            {status !== "LoadingFirstPage" && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {tUI("noUsersFound")}
                </TableCell>
              </TableRow>
            )}

            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">
                  {user.displayName}
                </TableCell>

                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {user.comment || "—"}
                    </span>

                    {me.role >= 3 && me._id !== user._id && (
                      <UserCommentDialog
                        userId={user._id}
                        initialComment={user.comment}
                      />
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Select
                    value={String(user.role)}
                    onValueChange={(v) =>
                      changeRole(user._id, Number(v))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem
                          key={r.value}
                          value={r.value}
                          disabled={!canAssignRole(me.role, user.role, Number(r.value))}
                        >
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{user._id}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyId(user._id)}
                    >
                      {tUI("copyId")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadMore(20)}
          >
            {tUI("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
