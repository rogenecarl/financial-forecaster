"use client";

import {
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  XCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const metrics = [
    {
      icon: Truck,
      label: "Total Trips",
      value: formatNumber(batch.tripCount),
      sub: "all imported trips",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: CheckCircle2,
      label: "Active Trips",
      value: formatNumber(activeTrips),
      sub: "excluding canceled",
      color: "text-teal-600",
      bgColor: "bg-teal-500/10",
    },
    {
      icon: Package,
      label: "Projected Loads",
      value: formatNumber(batch.loadCount),
      sub: `from ${formatNumber(activeTrips)} active`,
      color: "text-indigo-600",
      bgColor: "bg-indigo-500/10",
      tooltip: `Total Load IDs from ${formatNumber(activeTrips)} active trips. Each trip can have multiple loads (CSV rows).`,
    },
    {
      icon: MapPin,
      label: "Projected Stops",
      value: formatNumber(batch.projectedLoads),
      sub: "delivery locations",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      tooltip: `Delivery stops from ${formatNumber(activeTrips)} active trips. Excludes bobtail movements and MSP stations.`,
    },
    {
      icon: XCircle,
      label: "Canceled",
      value: formatNumber(batch.canceledCount),
      sub: "excluded from totals",
      color:
        batch.canceledCount > 0 ? "text-red-600" : "text-muted-foreground",
      bgColor: batch.canceledCount > 0 ? "bg-red-500/10" : "bg-muted",
    },
  ];

  return (
    <div className="space-y-3">
      <Card className="">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Trip Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      metric.bgColor
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", metric.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {metric.label}
                      </span>
                      {metric.tooltip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{metric.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        metric.color === "text-muted-foreground"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {metric.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {metric.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>

        {/* Canceled trips note */}
        {batch.canceledCount > 0 && (
          <div className="border-t px-6 py-3 bg-amber-50/50 dark:bg-amber-950/10">
            <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>Note:</strong> Canceled trips are not included in the
                active trips count, projected loads, or projected stops. Only{" "}
                {formatNumber(activeTrips)} active trips contribute to the
                projected revenue calculations.
              </span>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
