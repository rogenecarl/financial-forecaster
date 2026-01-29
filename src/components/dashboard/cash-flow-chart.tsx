"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import type { CashFlowDataPoint } from "@/actions/dashboard/dashboard";

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function CashFlowChart({ data, loading = false }: CashFlowChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end gap-2 pb-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-2">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0 && data.some((d) => d.revenue > 0 || d.expenses > 0);

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.expenses)),
    1
  );

  // Find min profit to handle negative values
  const minProfit = Math.min(...data.map((d) => d.profit), 0);
  const maxProfit = Math.max(...data.map((d) => d.profit), 0);
  const profitRange = Math.max(Math.abs(minProfit), Math.abs(maxProfit), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Trend</CardTitle>
        <CardDescription>Last 8 weeks performance</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-red-400" />
                <span className="text-muted-foreground">Expenses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Profit</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-[250px] flex items-end gap-1 sm:gap-2 pt-4">
              {data.map((point, index) => {
                const revenueHeight = (point.revenue / maxValue) * 100;
                const expensesHeight = (point.expenses / maxValue) * 100;
                const profitHeight = Math.abs(point.profit / profitRange) * 50;
                const isProfitNegative = point.profit < 0;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    {/* Bars Container */}
                    <div className="w-full h-[200px] flex items-end justify-center gap-0.5 relative">
                      {/* Revenue Bar */}
                      <div
                        className="w-1/3 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:bg-emerald-600"
                        style={{ height: `${revenueHeight}%` }}
                        title={`Revenue: ${formatCurrency(point.revenue)}`}
                      />
                      {/* Expenses Bar */}
                      <div
                        className="w-1/3 bg-red-400 rounded-t-sm transition-all duration-300 hover:bg-red-500"
                        style={{ height: `${expensesHeight}%` }}
                        title={`Expenses: ${formatCurrency(point.expenses)}`}
                      />
                      {/* Profit/Loss Indicator */}
                      <div
                        className={`w-1/3 rounded-t-sm transition-all duration-300 ${
                          isProfitNegative
                            ? "bg-blue-300 hover:bg-blue-400"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                        style={{
                          height: `${Math.max(profitHeight, 5)}%`,
                          opacity: isProfitNegative ? 0.6 : 1,
                        }}
                        title={`Profit: ${formatCurrency(point.profit)}`}
                      />
                    </div>
                    {/* Week Label */}
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {point.week}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-sm font-medium text-red-600">
                  {formatCurrency(data.reduce((sum, d) => sum + d.expenses, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p
                  className={`text-sm font-medium ${
                    data.reduce((sum, d) => sum + d.profit, 0) >= 0
                      ? "text-blue-600"
                      : "text-blue-400"
                  }`}
                >
                  {formatCurrency(data.reduce((sum, d) => sum + d.profit, 0))}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No cash flow data yet</p>
            <p className="text-xs text-muted-foreground">
              Import transactions to see trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
