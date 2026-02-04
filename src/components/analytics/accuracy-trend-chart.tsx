"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccuracyTrendPoint {
  batchId: string;
  batchName: string;
  projected: number;
  actual: number;
  accuracy: number;
  variance: number;
  createdAt: Date;
}

interface AccuracyTrendChartProps {
  data: AccuracyTrendPoint[];
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function AccuracyTrendChart({ data, loading = false }: AccuracyTrendChartProps) {
  if (loading) {
    // Pre-defined heights for skeleton bars (deterministic)
    const skeletonHeights = [60, 85, 45, 70, 90, 55, 75, 40, 80, 65, 50, 95];
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end gap-2">
            {skeletonHeights.map((height, i) => (
              <div key={i} className="flex-1">
                <Skeleton className="w-full" style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0;

  // Calculate average accuracy
  const avgAccuracy = hasData
    ? data.reduce((sum, d) => sum + d.accuracy, 0) / data.length
    : 0;

  // Calculate trend (improving, declining, stable)
  const trend = hasData && data.length >= 2
    ? data[data.length - 1].accuracy - data[0].accuracy
    : 0;

  const getTrendLabel = () => {
    if (trend > 2) return "Improving";
    if (trend < -2) return "Declining";
    return "Stable";
  };

  const getTrendColor = () => {
    if (trend > 2) return "text-emerald-600";
    if (trend < -2) return "text-red-600";
    return "text-blue-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          Accuracy Trend
        </CardTitle>
        <CardDescription>
          Model accuracy over the last {data.length} batches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pb-4 border-b">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Average Accuracy</p>
                <p className={cn(
                  "text-lg font-semibold",
                  avgAccuracy >= 95 ? "text-emerald-600" : avgAccuracy >= 90 ? "text-blue-600" : "text-amber-600"
                )}>
                  {avgAccuracy.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Trend</p>
                <p className={cn("text-lg font-semibold", getTrendColor())}>
                  {getTrendLabel()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Best Batch</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {Math.max(...data.map(d => d.accuracy)).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Accuracy Line Chart (simplified bar representation) */}
            <div className="h-[220px] flex items-end gap-1 pt-4 relative">
              {/* Target line at 95% */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-300"
                style={{ bottom: "95%" }}
              >
                <span className="absolute -top-5 right-0 text-[10px] text-emerald-600 bg-background px-1">
                  95% target
                </span>
              </div>

              {data.map((point, index) => {
                const height = Math.max(point.accuracy, 5);
                const isGood = point.accuracy >= 95;
                const isOkay = point.accuracy >= 90;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0 group"
                  >
                    {/* Bar */}
                    <div className="w-full h-[180px] flex items-end justify-center relative">
                      <div
                        className={cn(
                          "w-full max-w-8 rounded-t-sm transition-all duration-300 cursor-pointer",
                          isGood
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : isOkay
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-amber-500 hover:bg-amber-600"
                        )}
                        style={{ height: `${height}%` }}
                        title={`${point.batchName}: ${point.accuracy.toFixed(1)}%`}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 shadow-md whitespace-nowrap">
                          <p className="font-medium">{point.batchName}</p>
                          <p>Accuracy: {point.accuracy.toFixed(1)}%</p>
                          <p>Variance: {formatCurrency(point.variance)}</p>
                        </div>
                      </div>
                    </div>
                    {/* Label */}
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">
                      {point.batchName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs pt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">&ge;95%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">90-95%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-amber-500" />
                <span className="text-muted-foreground">&lt;90%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No accuracy data yet</p>
            <p className="text-xs text-muted-foreground">
              Complete batches with actual revenue to see trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
