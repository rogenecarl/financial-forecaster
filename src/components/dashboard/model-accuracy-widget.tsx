"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ModelAccuracy {
  accuracy: number;
  weekCount: number;
}

interface ModelAccuracyWidgetProps {
  data: ModelAccuracy | null;
  loading?: boolean;
}

export function ModelAccuracyWidget({ data, loading = false }: ModelAccuracyWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  const accuracy = data?.accuracy ?? 0;
  const weekCount = data?.weekCount ?? 0;

  const getAccuracyColor = () => {
    if (accuracy >= 98) return "text-emerald-600";
    if (accuracy >= 95) return "text-blue-600";
    if (accuracy >= 90) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (accuracy >= 98) return "bg-emerald-500";
    if (accuracy >= 95) return "bg-blue-500";
    if (accuracy >= 90) return "bg-amber-500";
    return "bg-red-500";
  };

  const getMessage = () => {
    if (weekCount === 0) return "No completed weeks yet";
    if (accuracy >= 98) return "Excellent forecasting accuracy!";
    if (accuracy >= 95) return "Great forecasting performance";
    if (accuracy >= 90) return "Good forecast alignment";
    return "Room for improvement";
  };

  return (
    <Card className={cn(
      "bg-gradient-to-br border",
      accuracy >= 95
        ? "from-emerald-50/50 to-emerald-100/30 border-emerald-200"
        : accuracy >= 90
        ? "from-blue-50/50 to-blue-100/30 border-blue-200"
        : "from-amber-50/50 to-amber-100/30 border-amber-200"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          Model Accuracy
        </CardTitle>
        <CardDescription>
          {weekCount > 0 ? `Last ${weekCount} week${weekCount !== 1 ? "s" : ""} average` : "Forecast performance"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={cn("text-3xl font-bold", getAccuracyColor())}>
          {weekCount > 0 ? `${accuracy.toFixed(1)}%` : "-"}
        </div>
        {weekCount > 0 && (
          <>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getProgressColor())}
                style={{ width: `${Math.min(100, accuracy)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {getMessage()}
            </p>
          </>
        )}
        {weekCount === 0 && (
          <p className="text-sm text-muted-foreground">
            Complete a week with actual revenue to see accuracy
          </p>
        )}
      </CardContent>
    </Card>
  );
}
