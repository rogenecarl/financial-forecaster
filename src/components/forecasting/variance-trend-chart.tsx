"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCompare } from "lucide-react";

interface VarianceTrendChartProps {
  data: Array<{
    weekLabel: string;
    projected: number;
    actual: number | null;
  }>;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function VarianceTrendChart({ data, loading = false }: VarianceTrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-end gap-2 pb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-2">
                <Skeleton className="h-[180px] w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0 && data.some((d) => d.projected > 0 || (d.actual !== null && d.actual > 0));

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.projected, d.actual ?? 0)),
    1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast vs Actual Trend</CardTitle>
        <CardDescription>Weekly comparison over time</CardDescription>
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
            <div className="h-[220px] flex items-end gap-1 sm:gap-3 pt-4">
              {data.map((point, index) => {
                const projectedHeight = (point.projected / maxValue) * 100;
                const actualHeight = point.actual !== null ? (point.actual / maxValue) * 100 : 0;
                const hasActual = point.actual !== null;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0"
                  >
                    {/* Bars Container */}
                    <div className="w-full h-[180px] flex items-end justify-center gap-1 relative">
                      {/* Projected Bar */}
                      <div
                        className="w-2/5 bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600 cursor-pointer"
                        style={{ height: `${Math.max(projectedHeight, 2)}%` }}
                        title={`Projected: ${formatCurrency(point.projected)}`}
                      />
                      {/* Actual Bar */}
                      <div
                        className={`w-2/5 rounded-t-sm transition-all duration-300 cursor-pointer ${
                          hasActual
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : "bg-slate-200"
                        }`}
                        style={{ height: `${Math.max(hasActual ? actualHeight : 5, 2)}%` }}
                        title={hasActual ? `Actual: ${formatCurrency(point.actual!)}` : "No actual data"}
                      />
                    </div>
                    {/* Week Label */}
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate w-full text-center">
                      {point.weekLabel}
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
                  {formatCurrency(data.reduce((sum, d) => sum + d.projected, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Actual</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(data.reduce((sum, d) => sum + (d.actual ?? 0), 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Variance</p>
                {(() => {
                  const totalProj = data.reduce((sum, d) => sum + d.projected, 0);
                  const totalAct = data.reduce((sum, d) => sum + (d.actual ?? 0), 0);
                  const variance = totalAct - totalProj;
                  return (
                    <p
                      className={`text-sm font-medium ${
                        variance >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {variance >= 0 ? "+" : ""}
                      {formatCurrency(variance)}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GitCompare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No trend data available</p>
            <p className="text-xs text-muted-foreground">
              Import trips and invoices to see trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
