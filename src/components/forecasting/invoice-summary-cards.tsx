"use client";

import {
  DollarSign,
  Fuel,
  Calculator,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  FileText,
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

interface InvoiceSummaryCardsProps {
  batch: TripBatchSummary;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function InvoiceSummaryCards({ batch }: InvoiceSummaryCardsProps) {
  const hasInvoice = batch.status === "INVOICED" && batch.actualTotal !== null;

  if (!hasInvoice) return null;

  const variance = batch.variance;
  const variancePercent = batch.variancePercent;

  const getVarianceIcon = () => {
    if (variance === null) return null;
    if (variance > 0) return <TrendingUp className="h-4 w-4" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const revenueMetrics = [
    {
      icon: DollarSign,
      label: "Tour Pay",
      value: formatCurrency(batch.actualTourPay),
      sub: `${batch.actualTours} tours`,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      tooltip: `Base compensation for ${batch.actualTours} completed tours (DTR rate).`,
    },
    {
      icon: Fuel,
      label: "Accessorials",
      value: formatCurrency(batch.actualAccessorials),
      sub: "accessorials",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      tooltip: "Fuel surcharge and other accessorial payments.",
    },
    {
      icon: Calculator,
      label: "Adjustments",
      value:
        batch.actualAdjustments !== null && batch.actualAdjustments !== 0
          ? formatCurrency(batch.actualAdjustments)
          : "$0",
      sub: "TONU, disputes",
      color:
        batch.actualAdjustments !== null && batch.actualAdjustments < 0
          ? "text-red-600"
          : batch.actualAdjustments !== null && batch.actualAdjustments > 0
            ? "text-emerald-600"
            : "text-muted-foreground",
      bgColor:
        batch.actualAdjustments !== null && batch.actualAdjustments < 0
          ? "bg-red-500/10"
          : batch.actualAdjustments !== null && batch.actualAdjustments > 0
            ? "bg-emerald-500/10"
            : "bg-muted",
      tooltip:
        "TONU, disputes, or other corrections applied to this invoice.",
    },
    {
      icon: BarChart3,
      label: "Total Pay",
      value: formatCurrency(batch.actualTotal),
      sub: "actual revenue",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoice Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-4">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {revenueMetrics.map((metric) => {
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
                    <Icon
                      className={cn("h-[18px] w-[18px]", metric.color)}
                    />
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
                        "text-lg font-bold tabular-nums",
                        metric.label === "Total Pay"
                          ? "text-emerald-700 dark:text-emerald-400"
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

          {/* Formula */}
          <div className="rounded-lg border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calculator className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">Formula:</span>
              <span className="font-mono">
                Total Pay = Tour Pay + Accessorials
                {batch.actualAdjustments !== null &&
                  batch.actualAdjustments !== 0 &&
                  (batch.actualAdjustments >= 0
                    ? " + Adjustments"
                    : " - Adjustments")}
              </span>
            </div>
          </div>

          {/* Revenue Comparison */}
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4" />
                Revenue Comparison
              </h4>
              {variance !== null && (
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                    variance >= 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {getVarianceIcon()}
                  {variance >= 0 ? "+" : ""}
                  {formatCurrency(variance)}
                  {variancePercent !== null && (
                    <span className="opacity-75">
                      ({variancePercent >= 0 ? "+" : ""}
                      {variancePercent.toFixed(1)}%)
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Projected Revenue */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium">Projected</span>
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                  {formatCurrency(batch.projectedTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {batch.projectedTours} tours
                </p>
              </div>

              {/* Actual Revenue */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium">Actual</span>
                </div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(batch.actualTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {batch.actualTours} tours
                </p>
              </div>

              {/* Variance */}
              <div className="text-center space-y-1">
                <div
                  className={cn(
                    "flex items-center justify-center gap-1.5",
                    variance !== null && variance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      variance !== null && variance >= 0
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    )}
                  />
                  <span className="text-xs font-medium">Variance</span>
                </div>
                <p
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    variance !== null && variance >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  )}
                >
                  {variance !== null && variance >= 0 ? "+" : ""}
                  {formatCurrency(variance)}
                </p>
                <p className="text-xs text-muted-foreground">difference</p>
              </div>
            </div>

            {/* Variance Formula */}
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calculator className="h-3.5 w-3.5" />
                <span className="font-medium">Variance:</span>
                <span className="font-mono">
                  Actual Revenue - Projected Revenue
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
