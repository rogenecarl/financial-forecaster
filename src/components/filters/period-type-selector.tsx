"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

interface PeriodTypeSelectorProps {
  value: PeriodType;
  onChange: (type: PeriodType) => void;
  disabled?: boolean;
  className?: string;
}

const PERIOD_CONFIG: Record<PeriodType, { label: string; description: string }> = {
  weekly: { label: "Weekly", description: "View by week" },
  monthly: { label: "Monthly", description: "View by month" },
  quarterly: { label: "Quarterly", description: "View by quarter" },
  yearly: { label: "Yearly", description: "View by year" },
  custom: { label: "Custom", description: "Custom date range" },
};

export function PeriodTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: PeriodTypeSelectorProps) {
  const config = PERIOD_CONFIG[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-w-[130px]", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{config.label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[180px]">
        {(Object.keys(PERIOD_CONFIG) as PeriodType[]).map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "flex flex-col items-start gap-0.5",
              value === type && "bg-accent"
            )}
          >
            <span className="font-medium">{PERIOD_CONFIG[type].label}</span>
            <span className="text-xs text-muted-foreground">
              {PERIOD_CONFIG[type].description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
