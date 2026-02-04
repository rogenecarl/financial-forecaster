"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Truck, Package, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekSummaryCardProps {
  weekInfo: {
    weekNumber: number;
    label: string;
    year: number;
  } | null;
  stats: {
    tripsCount: number;
    canceledCount: number;
    projectedLoads: number;
    actualLoads: number | null;
    projectedRevenue: number;
    actualRevenue: number | null;
  };
  loading?: boolean;
}

export function WeekSummaryCard({ weekInfo, stats, loading = false }: WeekSummaryCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateVariance = (projected: number, actual: number | null) => {
    if (actual === null) return null;
    return actual - projected;
  };

  const calculateVariancePercent = (projected: number, actual: number | null) => {
    if (actual === null || projected === 0) return null;
    return ((actual - projected) / projected) * 100;
  };

  const revenueVariance = calculateVariance(stats.projectedRevenue, stats.actualRevenue);
  const revenueVariancePercent = calculateVariancePercent(stats.projectedRevenue, stats.actualRevenue);
  const loadsVariance = calculateVariance(stats.projectedLoads, stats.actualLoads);

  const getVarianceIcon = (variance: number | null) => {
    if (variance === null) return null;
    if (variance > 0) return <TrendingUp className="h-4 w-4" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getVarianceColor = (variance: number | null) => {
    if (variance === null) return "text-muted-foreground";
    if (variance > 0) return "text-emerald-600";
    if (variance < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {weekInfo ? `Week ${weekInfo.weekNumber} Summary` : "Week Summary"}
            </CardTitle>
            {weekInfo && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {weekInfo.label}, {weekInfo.year}
              </p>
            )}
          </div>
          {stats.actualRevenue !== null && revenueVariance !== null && (
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium",
                revenueVariance >= 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {getVarianceIcon(revenueVariance)}
              <span>
                {revenueVariance >= 0 ? "+" : ""}
                {formatCurrency(revenueVariance)}
              </span>
              {revenueVariancePercent !== null && (
                <span className="text-xs opacity-75">
                  ({revenueVariancePercent >= 0 ? "+" : ""}
                  {revenueVariancePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Trips */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Trips</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.tripsCount}</span>
              {stats.canceledCount > 0 && (
                <span className="text-xs text-red-600">
                  ({stats.canceledCount} canceled)
                </span>
              )}
            </div>
          </div>

          {/* Loads */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Loads</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.projectedLoads}</span>
              {stats.actualLoads !== null && (
                <span
                  className={cn(
                    "text-sm font-medium flex items-center gap-0.5",
                    getVarianceColor(loadsVariance)
                  )}
                >
                  / {stats.actualLoads}
                  {loadsVariance !== null && loadsVariance !== 0 && (
                    <span className="text-xs">
                      ({loadsVariance > 0 ? "+" : ""}{loadsVariance})
                    </span>
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.actualLoads !== null ? "projected / actual" : "projected"}
            </p>
          </div>

          {/* Projected Revenue */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Projected</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(stats.projectedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">revenue</p>
          </div>

          {/* Actual Revenue */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Actual</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-2xl font-bold",
                  stats.actualRevenue !== null ? "text-blue-700" : "text-muted-foreground"
                )}
              >
                {formatCurrency(stats.actualRevenue)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.actualRevenue !== null ? "revenue" : "awaiting invoice"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
