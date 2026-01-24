// components/logs/TargetTableSelect.tsx
"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

type Props = {
  value?: string;
  onChange: (value?: string) => void;
};

const TARGET_TABLES = [
  "exceptions",
  "scheduleGroups",
  "scheduleEvents",
  "selectedSchedules",
  "songs",
  "playlists",
  "selectedPlaylists",
] as const;

export default function TargetTableSelect({ value, onChange }: Props) {
  const t = useTranslations("UI")
  return (
    <Select
      value={value ?? "ALL"}
      onValueChange={(v) => onChange(v === "ALL" ? undefined : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={t("targetTable")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("allTables")}</SelectItem>
        {TARGET_TABLES.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
