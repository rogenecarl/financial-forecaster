"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripBatchStatusBadge } from "./trip-batch-status-badge";
import { Truck, Package, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripBatchSummary } from "@/actions/forecasting/trip-batches";

interface TripBatchCardProps {
  batch: TripBatchSummary;
  onClick?: () => void;
}

export function TripBatchCard({ batch, onClick }: TripBatchCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasVariance = batch.variance !== null;
  const isPositiveVariance = hasVariance && batch.variance! >= 0;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer border-l-4",
        batch.status === "EMPTY" && "border-l-slate-300",
        batch.status === "UPCOMING" && "border-l-blue-400",
        batch.status === "IN_PROGRESS" && "border-l-amber-400",
        batch.status === "COMPLETED" && "border-l-emerald-400",
        batch.status === "INVOICED" && "border-l-purple-400"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold truncate">
              {batch.name}
            </CardTitle>
            {batch.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {batch.description}
              </p>
            )}
          </div>
          <TripBatchStatusBadge status={batch.status} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>
              <span className="font-medium text-foreground">{batch.tripCount}</span> trips
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              <span className="font-medium text-foreground">{batch.projectedLoads}</span> loads
            </span>
          </div>
          <div className="ml-auto font-semibold text-emerald-700">
            {formatCurrency(batch.projectedTotal)}
          </div>
        </div>

        {/* Variance row (only for invoiced batches) */}
        {batch.status === "INVOICED" && hasVariance && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                isPositiveVariance ? "text-emerald-600" : "text-red-600"
              )}
            >
              {isPositiveVariance ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositiveVariance ? "+" : ""}
                {formatCurrency(batch.variance)}
              </span>
              {batch.variancePercent !== null && (
                <span className="text-xs opacity-75">
                  ({batch.variancePercent >= 0 ? "+" : ""}
                  {batch.variancePercent.toFixed(1)}%)
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Actual: {formatCurrency(batch.actualTotal)}
            </span>
          </div>
        )}

        {/* Dates row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Created {format(new Date(batch.createdAt), "MMM d, yyyy")}</span>
          {batch.invoiceImportedAt && (
            <span>
              Invoiced {format(new Date(batch.invoiceImportedAt), "MMM d")}
            </span>
          )}
          {!batch.invoiceImportedAt && batch.tripsImportedAt && (
            <span>
              Imported {format(new Date(batch.tripsImportedAt), "MMM d")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
