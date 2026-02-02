"use client";

import { useMemo } from "react";
import { Calendar, Check, ChevronDown, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WeekOption } from "@/actions/filters";

interface WeekSelectorProps {
  weeks: WeekOption[];
  selectedWeekId: string | null;
  onWeekChange: (weekId: string | null) => void;
  loading?: boolean;
  showAllOption?: boolean;
  className?: string;
}

export function WeekSelector({
  weeks,
  selectedWeekId,
  onWeekChange,
  loading = false,
  showAllOption = true,
  className,
}: WeekSelectorProps) {
  const selectedWeek = useMemo(
    () => weeks.find((w) => w.id === selectedWeekId),
    [weeks, selectedWeekId]
  );

  // Group weeks by status for better organization
  const { currentWeeks, pastWeeks, futureWeeks } = useMemo(() => {
    const now = new Date();
    const current: WeekOption[] = [];
    const past: WeekOption[] = [];
    const future: WeekOption[] = [];

    for (const week of weeks) {
      if (week.weekStart <= now && week.weekEnd >= now) {
        current.push(week);
      } else if (week.weekEnd < now) {
        past.push(week);
      } else {
        future.push(week);
      }
    }

    return {
      currentWeeks: current,
      pastWeeks: past.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()),
      futureWeeks: future.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime()),
    };
  }, [weeks]);

  const getStatusBadge = (week: WeekOption) => {
    if (week.status === "completed") {
      return (
        <Badge variant="outline" className="ml-auto text-[10px] bg-green-50 text-green-700 border-green-200">
          Actual
        </Badge>
      );
    }
    if (week.status === "in_progress") {
      return (
        <Badge variant="outline" className="ml-auto text-[10px] bg-blue-50 text-blue-700 border-blue-200">
          In Progress
        </Badge>
      );
    }
    if (week.hasTrips) {
      return (
        <Badge variant="outline" className="ml-auto text-[10px] bg-amber-50 text-amber-700 border-amber-200">
          Projected
        </Badge>
      );
    }
    return null;
  };

  const displayLabel = useMemo(() => {
    if (selectedWeekId === null) return "All Weeks";
    if (selectedWeek) {
      return `Week ${selectedWeek.weekNumber}: ${selectedWeek.label}`;
    }
    return "Select Week";
  }, [selectedWeekId, selectedWeek]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-w-[200px]", className)}
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] max-h-[400px] overflow-y-auto">
        {showAllOption && (
          <>
            <DropdownMenuItem
              onClick={() => onWeekChange(null)}
              className="flex items-center gap-2"
            >
              {selectedWeekId === null && <Check className="h-4 w-4" />}
              {selectedWeekId !== null && <span className="w-4" />}
              <span>All Weeks</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Current Week */}
        {currentWeeks.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Current Week
            </DropdownMenuLabel>
            {currentWeeks.map((week) => (
              <DropdownMenuItem
                key={week.id}
                onClick={() => onWeekChange(week.id)}
                className="flex items-center gap-2"
              >
                {selectedWeekId === week.id && <Check className="h-4 w-4" />}
                {selectedWeekId !== week.id && <span className="w-4" />}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-medium">Week {week.weekNumber}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{week.label}</span>
                  </div>
                  {getStatusBadge(week)}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Future Weeks */}
        {futureWeeks.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Upcoming
            </DropdownMenuLabel>
            {futureWeeks.slice(0, 4).map((week) => (
              <DropdownMenuItem
                key={week.id}
                onClick={() => onWeekChange(week.id)}
                className="flex items-center gap-2"
              >
                {selectedWeekId === week.id && <Check className="h-4 w-4" />}
                {selectedWeekId !== week.id && <span className="w-4" />}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-medium">Week {week.weekNumber}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{week.label}</span>
                  </div>
                  {week.hasTrips && (
                    <span className="text-xs text-muted-foreground">
                      {week.tripCount} trips
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Past Weeks */}
        {pastWeeks.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Past Weeks
            </DropdownMenuLabel>
            {pastWeeks.slice(0, 12).map((week) => (
              <DropdownMenuItem
                key={week.id}
                onClick={() => onWeekChange(week.id)}
                className="flex items-center gap-2"
              >
                {selectedWeekId === week.id && <Check className="h-4 w-4" />}
                {selectedWeekId !== week.id && <span className="w-4" />}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-medium">Week {week.weekNumber}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{week.label}</span>
                    {week.year !== new Date().getFullYear() && (
                      <span className="text-muted-foreground ml-1 text-xs">({week.year})</span>
                    )}
                  </div>
                  {getStatusBadge(week)}
                </div>
              </DropdownMenuItem>
            ))}
            {pastWeeks.length > 12 && (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground justify-center">
                +{pastWeeks.length - 12} more weeks
              </DropdownMenuItem>
            )}
          </>
        )}

        {weeks.length === 0 && !loading && (
          <DropdownMenuItem disabled className="text-muted-foreground justify-center">
            No weeks available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
