"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Category } from "@/lib/generated/prisma/client";

interface CategorySelectProps {
  value: string | null;
  onValueChange: (categoryId: string | null) => void;
  categories: Category[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showUncategorized?: boolean;
}

export function CategorySelect({
  value,
  onValueChange,
  categories,
  loading = false,
  disabled = false,
  placeholder = "Select category",
  className,
  showUncategorized = true,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCategory = value
    ? categories.find((c) => c.id === value)
    : null;

  // Group categories by type
  const revenueCategories = categories.filter((c) => c.type === "REVENUE");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const transferCategories = categories.filter((c) => c.type === "TRANSFER");
  const unknownCategories = categories.filter((c) => c.type === "UNKNOWN");

  const renderCategory = (category: Category) => (
    <button
      key={category.id}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100",
        value === category.id && "bg-slate-100"
      )}
      onClick={() => {
        onValueChange(category.id);
        setOpen(false);
      }}
    >
      <Circle
        className="h-3 w-3"
        style={{ fill: category.color, color: category.color }}
      />
      <span className="flex-1 text-left">{category.name}</span>
      {value === category.id && <Check className="h-4 w-4" />}
    </button>
  );

  const renderGroup = (title: string, items: Category[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title}>
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
          {title}
        </div>
        {items.map(renderCategory)}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "justify-between font-normal",
            !selectedCategory && "text-slate-500",
            className
          )}
        >
          {selectedCategory ? (
            <span className="flex items-center gap-2">
              <Circle
                className="h-3 w-3"
                style={{
                  fill: selectedCategory.color,
                  color: selectedCategory.color,
                }}
              />
              {selectedCategory.name}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-1 space-y-1">
            {showUncategorized && (
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100",
                  value === null && "bg-slate-100"
                )}
                onClick={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
              >
                <Circle className="h-3 w-3 text-slate-300" />
                <span className="flex-1 text-left text-slate-500">
                  Uncategorized
                </span>
                {value === null && <Check className="h-4 w-4" />}
              </button>
            )}
            {renderGroup("Revenue", revenueCategories)}
            {renderGroup("Expenses", expenseCategories)}
            {renderGroup("Transfers", transferCategories)}
            {renderGroup("Other", unknownCategories)}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
