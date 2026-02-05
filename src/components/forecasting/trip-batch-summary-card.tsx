"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Truck,
  Package,
  MapPin,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripBatchSummary } from "@/actions/forecasting/trip-batches";

interface TripBatchSummaryCardProps {
  batch: TripBatchSummary | null;
  loading?: boolean;
}

export function TripBatchSummaryCard({
  batch,
  loading = false,
}: TripBatchSummaryCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

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
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-muted/60 to-muted/30 p-6">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-7 w-36 rounded-full" />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!batch) return null;

  const variance = batch.variance;
  const variancePercent = batch.variancePercent;
  const hasActuals = batch.actualTotal !== null;

  const metrics = [
    {
      icon: Truck,
      label: "Trips",
      value: batch.tripCount.toString(),
      sub:
        batch.canceledCount > 0
          ? `${batch.canceledCount} canceled`
          : undefined,
      subColor: "text-red-500",
    },
    {
      icon: Package,
      label: "Loads",
      value: batch.loadCount.toString(),
      sub:
        batch.actualLoads !== null
          ? `${batch.actualLoads} actual`
          : "projected",
      subColor:
        batch.actualLoads !== null
          ? getVarianceColor(batch.actualLoads - batch.loadCount)
          : "text-muted-foreground",
    },
    {
      icon: MapPin,
      label: "Stops",
      value: batch.projectedLoads.toString(),
      sub: "projected",
      subColor: "text-muted-foreground",
    },
    {
      icon: DollarSign,
      label: "Projected",
      value: formatCurrency(batch.projectedTotal),
      sub: "revenue",
      subColor: "text-muted-foreground",
      valueColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      icon: BarChart3,
      label: "Actual",
      value: formatCurrency(batch.actualTotal),
      sub: hasActuals ? "revenue" : "awaiting invoice",
      subColor: "text-muted-foreground",
      valueColor: hasActuals
        ? "text-blue-700 dark:text-blue-400"
        : "text-muted-foreground",
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-muted/60 to-muted/30 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Batch Overview
          </h3>
          {hasActuals && variance !== null && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
                variance >= 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {getVarianceIcon(variance)}
              <span>
                {variance >= 0 ? "+" : ""}
                {formatCurrency(variance)}
              </span>
              {variancePercent !== null && (
                <span className="text-xs opacity-70">
                  ({variancePercent >= 0 ? "+" : ""}
                  {variancePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-wider font-medium">
                    {metric.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-2xl md:text-3xl font-bold tracking-tight tabular-nums",
                    metric.valueColor || "text-foreground"
                  )}
                >
                  {metric.value}
                </div>
                {metric.sub && (
                  <p
                    className={cn(
                      "text-xs",
                      metric.subColor || "text-muted-foreground"
                    )}
                  >
                    {metric.sub}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
