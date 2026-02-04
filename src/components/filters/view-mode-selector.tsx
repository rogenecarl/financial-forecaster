"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ViewMode = "single_week" | "week_range" | "monthly" | "quarterly" | "ytd";

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  className?: string;
}

const VIEW_MODE_CONFIG: Record<ViewMode, { label: string; shortLabel: string }> = {
  single_week: { label: "Single Week", shortLabel: "Week" },
  week_range: { label: "Week Range", shortLabel: "Range" },
  monthly: { label: "Monthly", shortLabel: "Month" },
  quarterly: { label: "Quarterly", shortLabel: "Quarter" },
  ytd: { label: "Year to Date", shortLabel: "YTD" },
};

export function ViewModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ViewModeSelectorProps) {
  return (
    <div className={cn("inline-flex rounded-lg border bg-muted p-1", className)}>
      {(Object.keys(VIEW_MODE_CONFIG) as ViewMode[]).map((mode) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange(mode)}
          className={cn(
            "px-3 py-1.5 h-auto text-sm font-medium transition-colors",
            value === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
          )}
        >
          <span className="hidden sm:inline">{VIEW_MODE_CONFIG[mode].label}</span>
          <span className="sm:hidden">{VIEW_MODE_CONFIG[mode].shortLabel}</span>
        </Button>
      ))}
    </div>
  );
}
