"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/categories";

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

    return (
        <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category || (categoryAll ? "All" : "")} onValueChange={handleChange}>
                <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {categoryAll && <SelectItem value="All">All</SelectItem>}
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