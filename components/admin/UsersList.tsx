"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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

const ROLES = [
  { value: "0", label: "Banned" },
  { value: "1", label: "User" },
  { value: "2", label: "Admin" },
];

export default function UsersList() {
  const [search, setSearch] = useState("");

  const users = useQuery(api.users.getUsers, {
    search: search || undefined,
  });

  const setRole = useMutation(api.users.setUserRole);

  async function changeRole(userId: Doc<"users">["_id"], role: number) {
    try {
      await setRole({ userId, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    toast.success("User ID copied");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      {/* Search */}
      <Input
        placeholder="Search by email or username"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>User ID</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!users && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}

            {users?.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">
                  {user.displayName}
                </TableCell>

                <TableCell>{user.email}</TableCell>

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
                        <SelectItem key={r.value} value={r.value}>
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
                      Copy
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
