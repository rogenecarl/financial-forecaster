"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { ThisWeekForecast } from "@/actions/dashboard/dashboard";

interface WeeklyForecastWidgetProps {
  data: ThisWeekForecast | null;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week&apos;s Forecast</CardTitle>
        <CardDescription>Week progress tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projected</span>
            <span className="font-medium">
              {hasData ? formatCurrency(data.projectedTotal) : "$0.00"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="font-medium">
              {hasData ? formatCurrency(data.currentTotal) : "$0.00"}
            </span>
          </div>
          <Progress
            value={hasData ? data.progressPercent : 0}
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {hasData ? data.progressPercent : 0}% of projected revenue
          </p>
        </div>
        <div className="pt-2 border-t border-border space-y-1">
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
