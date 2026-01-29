"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { getCategoriesForFilter } from "@/actions/reports/report-data";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface CategorySelectorProps {
  value: string[];
  onChange: (categoryIds: string[]) => void;
  disabled?: boolean;
}

export function CategorySelector({
  value,
  onChange,
  disabled,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      const result = await getCategoriesForFilter();
      if (result.success && result.data) {
        setCategories(result.data);
      }
      setLoading(false);
    }
    loadCategories();
  }, []);

  const handleToggle = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter((id) => id !== categoryId));
    } else {
      onChange([...value, categoryId]);
    }
  };

  const handleSelectAll = () => {
    onChange(categories.map((c) => c.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const groupedCategories = categories.reduce(
    (acc, cat) => {
      const type = cat.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(cat);
      return acc;
    },
    {} as Record<string, Category[]>
  );

  const displayText =
    value.length === 0
      ? "All categories"
      : value.length === categories.length
        ? "All categories"
        : `${value.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || loading}
          className="w-[180px] justify-between"
        >
          {loading ? "Loading..." : displayText}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <div className="p-2 border-b flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            Clear
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {Object.entries(groupedCategories).map(([type, cats]) => (
            <div key={type} className="mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                {type}
              </div>
              {cats.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 py-1"
                >
                  <Checkbox
                    id={category.id}
                    checked={value.includes(category.id)}
                    onCheckedChange={() => handleToggle(category.id)}
                  />
                  <Label
                    htmlFor={category.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
