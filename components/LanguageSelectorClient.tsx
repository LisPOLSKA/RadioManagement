"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Globe } from "lucide-react";

type Props = {
  defaultLang: string;
};

export const LanguageSelectorClient: React.FC<Props> = ({ defaultLang }) => {
  const [lang, setLang] = React.useState(defaultLang);

  const handleChange = (value: string) => {
    setLang(value);
    // Update cookie
    document.cookie = `locale=${value}; path=/`;
    document.location.reload();
  };

  return (
    <Select value={lang} onValueChange={handleChange}>
      <SelectTrigger className="w-auto gap-2">
        <Globe className="h-4 w-4" />
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="pl">Polski</SelectItem>
      </SelectContent>
    </Select>
  );
};