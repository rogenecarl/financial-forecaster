"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
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

  if (!batch) return null;

  const variance = batch.variance;
  const variancePercent = batch.variancePercent;
  const hasActuals = batch.actualTotal !== null;

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Summary</CardTitle>
          {hasActuals && variance !== null && (
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium",
                variance >= 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {getVarianceIcon(variance)}
              <span>
                {variance >= 0 ? "+" : ""}
                {formatCurrency(variance)}
              </span>
              {variancePercent !== null && (
                <span className="text-xs opacity-75">
                  ({variancePercent >= 0 ? "+" : ""}
                  {variancePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {/* Trips */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Trips</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{batch.tripCount}</span>
              {batch.canceledCount > 0 && (
                <span className="text-xs text-red-600">
                  ({batch.canceledCount} canceled)
                </span>
              )}
            </div>
          </div>

          {/* Projected Loads */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Loads</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{batch.loadCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">projected</p>
          </div>

          {/* Projected Stops */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Stops</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{batch.projectedLoads}</span>
              {batch.actualLoads !== null && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    getVarianceColor(
                      batch.actualLoads - batch.projectedLoads
                    )
                  )}
                >
                  / {batch.actualLoads}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {batch.actualLoads !== null ? "projected / actual" : "projected"}
            </p>
          </div>

          {/* Projected Revenue */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Projected</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(batch.projectedTotal)}
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
                  hasActuals ? "text-blue-700" : "text-muted-foreground"
                )}
              >
                {formatCurrency(batch.actualTotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActuals ? "revenue" : "awaiting invoice"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
