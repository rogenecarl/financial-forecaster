"use client";

import { format, getWeek } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ThisWeekForecast } from "@/actions/dashboard/dashboard";

interface WeeklyForecastWidgetProps {
  data: ThisWeekForecast | null;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function WeeklyForecastWidget({ data, loading = false }: WeeklyForecastWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="pt-2 border-t space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data !== null && data.projectedTotal > 0;
  const weekNumber = data ? getWeek(new Date(data.weekStart), { weekStartsOn: 1 }) : getWeek(new Date(), { weekStartsOn: 1 });
  const weekDateRange = data
    ? `${format(new Date(data.weekStart), "MMM d")} - ${format(new Date(data.weekEnd), "MMM d")}`
    : "";

  // Calculate variance
  const variance = hasData && data && data.currentTotal > 0 ? data.currentTotal - data.projectedTotal : null;
  const variancePercent = variance !== null && data && data.projectedTotal > 0
    ? (variance / data.projectedTotal) * 100
    : null;

  const getVarianceIcon = () => {
    if (variance === null) return null;
    if (variance > 0) return <TrendingUp className="h-3.5 w-3.5" />;
    if (variance < 0) return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Week {weekNumber}</span>
          {variance !== null && (
            <span
              className={cn(
                "text-sm font-medium flex items-center gap-1 px-2 py-0.5 rounded-full",
                variance >= 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {getVarianceIcon()}
              {variance >= 0 ? "+" : ""}
              {formatCurrency(variance)}
            </span>
          )}
        </CardTitle>
        <CardDescription>{weekDateRange}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projected</span>
            <span className="font-medium text-blue-700">
              {hasData ? formatCurrency(data.projectedTotal) : "$0"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Actual</span>
            <span className={cn(
              "font-medium",
              hasData && data.currentTotal > 0 ? "text-emerald-700" : "text-muted-foreground"
            )}>
              {hasData && data.currentTotal > 0 ? formatCurrency(data.currentTotal) : "-"}
            </span>
          </div>
          <Progress
            value={hasData ? data.progressPercent : 0}
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {hasData ? data.progressPercent : 0}% complete
            {variancePercent !== null && (
              <span className={variance && variance >= 0 ? "text-emerald-600" : "text-red-600"}>
                {" "}({variancePercent >= 0 ? "+" : ""}{variancePercent.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
        <div className="pt-2 border-t border-blue-200 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trips</span>
            <span>
              {hasData ? data.tripsCompleted : 0}/{hasData ? data.tripsTotal : 0} completed
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Loads</span>
            <span>
              {hasData ? data.loadsDelivered : 0}/{hasData ? data.loadsTotal : 0} delivered
            </span>
          </div>
        </div>
        {!hasData && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            Import trips to see this week&apos;s forecast
          </p>
        )}
      </CardContent>
    </Card>
  );
}
