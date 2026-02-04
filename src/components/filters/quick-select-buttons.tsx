"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type QuickSelectOption =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter";

interface QuickSelectButtonsProps {
  selected?: QuickSelectOption;
  onSelect: (option: QuickSelectOption) => void;
  disabled?: boolean;
  className?: string;
}

const QUICK_SELECT_OPTIONS: { value: QuickSelectOption; label: string }[] = [
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisQuarter", label: "This Quarter" },
];

export function QuickSelectButtons({
  selected,
  onSelect,
  disabled = false,
  className,
}: QuickSelectButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <span className="text-sm text-muted-foreground self-center mr-1">Quick:</span>
      {QUICK_SELECT_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(option.value)}
          className="h-7 px-2.5 text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
