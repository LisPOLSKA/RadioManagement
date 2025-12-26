// components/logs/ActionSelect.tsx
"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  value?: string;
  onChange: (value?: string) => void;
};

const logActions = [
    "CREATE_SONG",
    "UPDATE_SONG",
    "DELETE_SONG",
    "CREATE_PLAYLIST",
    "UPDATE_PLAYLIST",
    "DELETE_PLAYLIST",
    "CREATE_SELECTED_PLAYLIST",
    "UPDATE_SELECTED_PLAYLIST",
    "DELETE_SELECTED_PLAYLIST",
    "CREATE_SCHEDULE",
    "UPDATE_SCHEDULE",
    "DELETE_SCHEDULE",
    "CREATE_SELECTED_SCHEDULE",
    "UPDATE_SELECTED_SCHEDULE",
    "DELETE_SELECTED_SCHEDULE",
    "UPSERT_EXCEPTION",
    "REGISTER_DEVICE",
] as const;

export default function ActionSelect({ value, onChange }: Props) {
  return (
    <Select
      value={value ?? "ALL"}
      onValueChange={(v) => onChange(v === "ALL" ? undefined : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Action" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All actions</SelectItem>
        {logActions.map((action) => (
          <SelectItem key={action} value={action}>
            {action}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
