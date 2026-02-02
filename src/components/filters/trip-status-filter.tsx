"use client";

import { useMemo } from "react";
import { Check, ChevronDown, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TripStatusCount } from "@/actions/filters";

export type TripStatusValue = "all" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

interface TripStatusFilterProps {
  statusCounts?: TripStatusCount[];
  selectedStatus: TripStatusValue;
  onStatusChange: (status: TripStatusValue) => void;
  loading?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<TripStatusValue, { label: string; color: string }> = {
  all: { label: "All Status", color: "text-muted-foreground" },
  UPCOMING: { label: "Upcoming", color: "text-blue-600" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-600" },
  COMPLETED: { label: "Completed", color: "text-green-600" },
  CANCELED: { label: "Canceled", color: "text-red-600" },
};

export function TripStatusFilter({
  statusCounts = [],
  selectedStatus,
  onStatusChange,
  loading = false,
  className,
}: TripStatusFilterProps) {
  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const sc of statusCounts) {
      map.set(sc.status, sc.count);
    }
    return map;
  }, [statusCounts]);

  const totalCount = useMemo(() => {
    let total = 0;
    for (const sc of statusCounts) {
      total += sc.count;
    }
    return total;
  }, [statusCounts]);

  const getCountLabel = (status: TripStatusValue): string => {
    if (status === "all") {
      return totalCount > 0 ? `(${totalCount})` : "";
    }
    const count = countsMap.get(status);
    return count ? `(${count})` : "";
  };

  const config = STATUS_CONFIG[selectedStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-w-[140px]", className)}
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Circle className={cn("h-3 w-3 fill-current", config.color)} />
            <span>{config.label}</span>
            {selectedStatus !== "all" && (
              <span className="text-xs text-muted-foreground">
                {getCountLabel(selectedStatus)}
              </span>
            )}
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[180px]">
        <DropdownMenuItem
          onClick={() => onStatusChange("all")}
          className="flex items-center gap-2"
        >
          {selectedStatus === "all" && <Check className="h-4 w-4" />}
          {selectedStatus !== "all" && <span className="w-4" />}
          <Circle className="h-3 w-3 text-muted-foreground" />
          <span className="flex-1">All Status</span>
          <span className="text-xs text-muted-foreground">{getCountLabel("all")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onStatusChange("UPCOMING")}
          className="flex items-center gap-2"
        >
          {selectedStatus === "UPCOMING" && <Check className="h-4 w-4" />}
          {selectedStatus !== "UPCOMING" && <span className="w-4" />}
          <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
          <span className="flex-1">Upcoming</span>
          <span className="text-xs text-muted-foreground">{getCountLabel("UPCOMING")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onStatusChange("IN_PROGRESS")}
          className="flex items-center gap-2"
        >
          {selectedStatus === "IN_PROGRESS" && <Check className="h-4 w-4" />}
          {selectedStatus !== "IN_PROGRESS" && <span className="w-4" />}
          <Circle className="h-3 w-3 fill-amber-600 text-amber-600" />
          <span className="flex-1">In Progress</span>
          <span className="text-xs text-muted-foreground">{getCountLabel("IN_PROGRESS")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onStatusChange("COMPLETED")}
          className="flex items-center gap-2"
        >
          {selectedStatus === "COMPLETED" && <Check className="h-4 w-4" />}
          {selectedStatus !== "COMPLETED" && <span className="w-4" />}
          <Circle className="h-3 w-3 fill-green-600 text-green-600" />
          <span className="flex-1">Completed</span>
          <span className="text-xs text-muted-foreground">{getCountLabel("COMPLETED")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onStatusChange("CANCELED")}
          className="flex items-center gap-2"
        >
          {selectedStatus === "CANCELED" && <Check className="h-4 w-4" />}
          {selectedStatus !== "CANCELED" && <span className="w-4" />}
          <Circle className="h-3 w-3 fill-red-600 text-red-600" />
          <span className="flex-1">Canceled</span>
          <span className="text-xs text-muted-foreground">{getCountLabel("CANCELED")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
