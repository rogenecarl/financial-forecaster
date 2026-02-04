"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyBreakdown {
  month: number;
  monthLabel: string;
  projected: number;
  actual: number;
  variance: number;
  accuracy: number;
  tripCount: number;
  loadCount: number;
  batchCount: number;
}

interface MonthlyBreakdownChartProps {
  data: MonthlyBreakdown[];
  year: number;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function MonthlyBreakdownChart({ data, year, loading = false }: MonthlyBreakdownChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-1">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0 && data.some((d) => d.projected > 0 || d.actual > 0);

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.projected, d.actual)),
    1
  );

  // Calculate totals
  const totalProjected = data.reduce((sum, d) => sum + d.projected, 0);
  const totalActual = data.reduce((sum, d) => sum + d.actual, 0);
  const totalVariance = totalActual - totalProjected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Monthly Breakdown
        </CardTitle>
        <CardDescription>
          Projected vs actual revenue by month for {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Projected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">Actual</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-[220px] flex items-end gap-1 pt-4">
              {data.map((month, index) => {
                const projectedHeight = (month.projected / maxValue) * 100;
                const actualHeight = month.actual > 0 ? (month.actual / maxValue) * 100 : 0;
                const hasActual = month.actual > 0;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0 group"
                  >
                    {/* Bars Container */}
                    <div className="w-full h-[180px] flex items-end justify-center gap-0.5 relative">
                      {/* Projected Bar */}
                      <div
                        className="w-2/5 bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600 cursor-pointer"
                        style={{ height: `${Math.max(projectedHeight, 2)}%` }}
                        title={`Projected: ${formatCurrency(month.projected)}`}
                      />
                      {/* Actual Bar */}
                      <div
                        className={cn(
                          "w-2/5 rounded-t-sm transition-all duration-300 cursor-pointer",
                          hasActual
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : "bg-slate-200"
                        )}
                        style={{ height: `${Math.max(hasActual ? actualHeight : 3, 2)}%` }}
                        title={hasActual ? `Actual: ${formatCurrency(month.actual)}` : "No actual data"}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 shadow-md whitespace-nowrap">
                          <p className="font-medium">{month.monthLabel}</p>
                          <p>Projected: {formatCurrency(month.projected)}</p>
                          {hasActual && <p>Actual: {formatCurrency(month.actual)}</p>}
                          {hasActual && (
                            <p className={month.variance >= 0 ? "text-emerald-600" : "text-red-600"}>
                              Variance: {month.variance >= 0 ? "+" : ""}{formatCurrency(month.variance)}
                            </p>
                          )}
                          <p>{month.tripCount} trips</p>
                        </div>
                      </div>
                    </div>
                    {/* Month Label */}
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">
                      {month.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Projected</p>
                <p className="text-sm font-medium text-blue-600">
                  {formatCurrency(totalProjected)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Actual</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(totalActual)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Variance</p>
                <p className={cn(
                  "text-sm font-medium",
                  totalVariance >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {totalVariance >= 0 ? "+" : ""}{formatCurrency(totalVariance)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No monthly data available</p>
            <p className="text-xs text-muted-foreground">
              Import trips and invoices to see breakdown
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
