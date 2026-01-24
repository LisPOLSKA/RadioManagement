"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/categories";
import { useTranslations } from "next-intl";

type Props = {
    selectedCategory?: string;
    onChange: (value: string) => void;
    categoryAll?: boolean;
};

export default function CategoryDropdown({ selectedCategory, onChange, categoryAll = false }: Props) {
    const [category, setCategory] = useState<string>(selectedCategory ?? "");

    function handleChange(value: string) {
        const newValue = value === "All" ? "" : value; // jeśli All → ""
        setCategory(newValue);
        onChange(newValue);
    }

    const t = useTranslations("UI");

    return (
        <div className="grid gap-2">
            <Label htmlFor="category">{t("category")}</Label>
            <Select value={category || (categoryAll ? "All" : "")} onValueChange={handleChange}>
                <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                    {categoryAll && <SelectItem value="All">{t("all")}</SelectItem>}
                    {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                            {cat}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}