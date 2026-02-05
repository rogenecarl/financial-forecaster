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
import { Card, CardContent } from "@/components/ui/card";
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

function formatCurrencyWithCents(value: number | null): string {
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

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Invoice Summary
      </h3>

      {/* Invoice Revenue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Tour Pay Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-blue-600 mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Tour Pay</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Base compensation for {batch.actualTours} completed tours (DTR rate).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrencyWithCents(batch.actualTourPay)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {batch.actualTours} tours
            </p>
          </CardContent>
        </Card>

        {/* Accessorials Card */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-amber-600 mb-2">
              <Fuel className="h-4 w-4" />
              <span className="text-xs font-medium">Accessorials</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Fuel surcharge and other accessorial payments.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrencyWithCents(batch.actualAccessorials)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              accessorials
            </p>
          </CardContent>
        </Card>

        {/* Adjustments Card */}
        <Card className={cn(
          "border-slate-200",
          batch.actualAdjustments !== null && batch.actualAdjustments !== 0
            ? batch.actualAdjustments < 0
              ? "border-red-200 bg-red-50/50 dark:bg-red-950/20"
              : "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "bg-slate-50/50 dark:bg-slate-900/20"
        )}>
          <CardContent className="p-4">
            <div className={cn(
              "flex items-center gap-1.5 mb-2",
              batch.actualAdjustments !== null && batch.actualAdjustments < 0
                ? "text-red-600"
                : batch.actualAdjustments !== null && batch.actualAdjustments > 0
                  ? "text-emerald-600"
                  : "text-muted-foreground"
            )}>
              <Calculator className="h-4 w-4" />
              <span className="text-xs font-medium">Adjustments</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      TONU, disputes, or other corrections applied to this invoice.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className={cn(
              "text-xl font-bold",
              batch.actualAdjustments !== null && batch.actualAdjustments < 0
                ? "text-red-700 dark:text-red-400"
                : batch.actualAdjustments !== null && batch.actualAdjustments > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground"
            )}>
              {batch.actualAdjustments !== null && batch.actualAdjustments !== 0
                ? formatCurrencyWithCents(batch.actualAdjustments)
                : "$0"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              TONU, disputes
            </p>
          </CardContent>
        </Card>

        {/* Total Pay Card */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Total Pay</span>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrencyWithCents(batch.actualTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              actual revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Formula */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calculator className="h-3.5 w-3.5" />
          <span className="font-medium">Formula:</span>
          <span className="font-mono">
            Total Pay = Tour Pay + Accessorials
            {batch.actualAdjustments !== null && batch.actualAdjustments !== 0 && (
              batch.actualAdjustments >= 0 ? " + Adjustments" : " - Adjustments"
            )}
          </span>
        </div>
      </div>

      {/* Revenue Comparison Summary Card */}
      <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 dark:from-slate-900/50 dark:to-slate-800/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" />
            Revenue Comparison
          </h4>
          {variance !== null && (
            <span className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              variance >= 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {getVarianceIcon()}
              {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
              {variancePercent !== null && (
                <span className="opacity-75">
                  ({variancePercent >= 0 ? "+" : ""}{variancePercent.toFixed(1)}%)
                </span>
              )}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Projected Revenue */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium">Projected</span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(batch.projectedTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {batch.projectedTours} tours
            </p>
          </div>

          {/* Actual Revenue */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">Actual</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(batch.actualTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {batch.actualTours} tours
            </p>
          </div>

          {/* Variance */}
          <div className="text-center">
            <div className={cn(
              "flex items-center justify-center gap-1.5 mb-1",
              variance !== null && variance >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                variance !== null && variance >= 0 ? "bg-emerald-500" : "bg-red-500"
              )} />
              <span className="text-xs font-medium">Variance</span>
            </div>
            <p className={cn(
              "text-lg font-bold",
              variance !== null && variance >= 0
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            )}>
              {variance !== null && variance >= 0 ? "+" : ""}{formatCurrency(variance)}
            </p>
            <p className="text-xs text-muted-foreground">
              difference
            </p>
          </div>
        </div>

        {/* Variance Formula */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" />
            <span className="font-medium">Variance:</span>
            <span className="font-mono">Actual Revenue - Projected Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
