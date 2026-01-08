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
    "UPDATE_SCHEDULE_GROUP",
    "CREATE_SCHEDULE_GROUP",
    "DELETE_SCHEDULE_GROUP",
    "CREATE_SELECTED_SCHEDULE",
    "UPDATE_SELECTED_SCHEDULE",
    "DELETE_SELECTED_SCHEDULE",
    "REGISTER_DEVICE",
    "UPDATE_SCHEDULE_EVENT",
    "CREATE_EXCEPTION",
    "UPDATE_EXCEPTION",
    "DELETE_EXCEPTION",
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
