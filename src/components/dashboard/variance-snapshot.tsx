"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VarianceSnapshotItem } from "@/actions/dashboard/dashboard";

interface VarianceSnapshotProps {
  data: VarianceSnapshotItem[];
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

export function VarianceSnapshot({ data, loading = false }: VarianceSnapshotProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Forecast Variance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-3 mb-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No invoiced batches yet</p>
            <p className="text-xs text-muted-foreground">
              Import invoices to compare projected vs actual
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Forecast Variance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((item) => {
            const isPositive = item.variance >= 0;

            return (
              <Link
                key={item.batchId}
                href={`/trips/${item.batchId}`}
                className="group rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground truncate pr-2">
                    {item.batchName}
                  </p>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Projected</span>
                    <span className="font-medium">{formatCurrency(item.projected)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Actual</span>
                    <span className="font-medium">{formatCurrency(item.actual)}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs w-full justify-center",
                      isPositive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        : "bg-red-50 text-red-700 hover:bg-red-50"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(item.variance)} ({isPositive ? "+" : ""}
                    {item.variancePercent.toFixed(1)}%)
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
