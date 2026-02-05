"use client";

import {
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  XCircle,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TripBatchSummary } from "@/actions/forecasting/trip-batches";

interface TripSummaryCardsProps {
  batch: TripBatchSummary;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function TripSummaryCards({ batch }: TripSummaryCardsProps) {
  const hasTrips = batch.tripCount > 0;

  if (!hasTrips) return null;

  const activeTrips = batch.tripCount - batch.canceledCount;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Truck className="h-4 w-4" />
        Trip Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Trips Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Truck className="h-4 w-4" />
              <span className="text-xs font-medium">Total Trips</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatNumber(batch.tripCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              all imported trips
            </p>
          </CardContent>
        </Card>

        {/* Active Trips Card */}
        <Card className="border-teal-200 bg-teal-50/50 dark:bg-teal-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-teal-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Active Trips</span>
            </div>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
              {formatNumber(activeTrips)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              excluding canceled
            </p>
          </CardContent>
        </Card>

        {/* Projected Loads Card */}
        <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium">Projected Loads</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Total Load IDs from {formatNumber(activeTrips)} active trips.
                      Each trip can have multiple loads (CSV rows).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
              {formatNumber(batch.loadCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              from {formatNumber(activeTrips)} active
            </p>
          </CardContent>
        </Card>

        {/* Projected Stops Card */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Projected Stops</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Delivery stops from {formatNumber(activeTrips)} active trips.
                      Excludes bobtail movements and MSP stations.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatNumber(batch.projectedLoads)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              delivery locations
            </p>
          </CardContent>
        </Card>

        {/* Canceled Trips Card */}
        <Card className={cn(
          "border-red-200",
          batch.canceledCount > 0
            ? "bg-red-50/50 dark:bg-red-950/20"
            : "bg-slate-50/50 dark:bg-slate-900/20"
        )}>
          <CardContent className="p-4 text-center">
            <div className={cn(
              "flex items-center justify-center gap-1 mb-1",
              batch.canceledCount > 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Canceled</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              batch.canceledCount > 0
                ? "text-red-700 dark:text-red-400"
                : "text-muted-foreground"
            )}>
              {formatNumber(batch.canceledCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              excluded from totals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Note about canceled trips */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
        <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <strong>Note:</strong> Canceled trips are not included in the active trips count,
            projected loads, or projected stops. Only {formatNumber(activeTrips)} active trips
            contribute to the projected revenue calculations.
          </span>
        </p>
      </div>
    </div>
  );
}
