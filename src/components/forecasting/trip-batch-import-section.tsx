"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripBatchSummary } from "@/actions/forecasting/trip-batches";

interface TripBatchImportSectionProps {
  batch: TripBatchSummary | null;
  loading?: boolean;
  onImportTrips: () => void;
  onAddTrips?: () => void;
  onImportInvoice: () => void;
}

export function TripBatchImportSection({
  batch,
  loading = false,
  onImportTrips,
  onAddTrips,
  onImportInvoice,
}: TripBatchImportSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-0.5 flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-0.5 flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!batch) return null;

  const hasTrips = batch.tripCount > 0;
  const hasInvoice = batch.status === "INVOICED";
  const isLocked = batch.status === "INVOICED";

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-0">
        {/* Stepper Pipeline */}
        <div className="flex items-center px-6 py-4 bg-muted/40 border-b">
          {/* Step 1: Trips */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                hasTrips
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "border-muted-foreground/30 text-muted-foreground bg-background"
              )}
            >
              {hasTrips ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                hasTrips ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Trips
            </span>
          </div>

          {/* Connector 1→2 */}
          <div className="flex-1 mx-4">
            <div
              className={cn(
                "h-0.5 rounded-full transition-all duration-500",
                hasTrips
                  ? "bg-gradient-to-r from-blue-400 to-violet-400"
                  : "bg-border"
              )}
            />
          </div>

          {/* Step 2: Invoice */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                hasInvoice
                  ? "bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-600/25"
                  : hasTrips
                    ? "border-violet-300 dark:border-violet-700 text-violet-500 bg-background"
                    : "border-muted-foreground/30 text-muted-foreground bg-background"
              )}
            >
              {hasInvoice ? <Check className="h-4 w-4" /> : "2"}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                hasInvoice || hasTrips ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Invoice
            </span>
          </div>

          {/* Connector 2→3 */}
          <div className="flex-1 mx-4">
            <div
              className={cn(
                "h-0.5 rounded-full transition-all duration-500",
                hasInvoice
                  ? "bg-gradient-to-r from-violet-400 to-emerald-400"
                  : "bg-border"
              )}
            />
          </div>

          {/* Step 3: Summary */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                hasInvoice
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                  : "border-muted-foreground/30 text-muted-foreground bg-background"
              )}
            >
              {hasInvoice ? <Check className="h-4 w-4" /> : "3"}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                hasInvoice ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Summary
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-border">
          {/* Trips Column */}
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  hasTrips
                    ? "bg-blue-100 dark:bg-blue-950/40"
                    : "bg-muted"
                )}
              >
                <FileSpreadsheet
                  className={cn(
                    "h-[18px] w-[18px]",
                    hasTrips ? "text-blue-600" : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">
                    {hasTrips ? `${batch.tripCount} trips` : "No trips"}
                  </span>
                  {isLocked && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasTrips && batch.tripsImportedAt
                    ? `Imported ${format(new Date(batch.tripsImportedAt), "MMM d, h:mm a")}`
                    : "Import from CSV to get started"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isLocked ? (
                <Button variant="outline" size="sm" disabled className="w-full">
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                  Locked
                </Button>
              ) : hasTrips ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onImportTrips}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Re-import
                  </Button>
                  {onAddTrips && (
                    <Button variant="outline" size="sm" onClick={onAddTrips}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              ) : (
                <Button size="sm" onClick={onImportTrips} className="w-full">
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import CSV
                </Button>
              )}
            </div>
          </div>

          {/* Invoice Column */}
          <div className="p-5 space-y-3 border-t md:border-t-0">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  hasInvoice
                    ? "bg-violet-100 dark:bg-violet-950/40"
                    : "bg-muted"
                )}
              >
                <FileText
                  className={cn(
                    "h-[18px] w-[18px]",
                    hasInvoice ? "text-violet-600" : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">
                    {hasInvoice ? "Invoice imported" : "Invoice pending"}
                  </span>
                  {hasInvoice && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {!hasInvoice && hasTrips && (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasInvoice && batch.invoiceImportedAt
                    ? `Imported ${format(new Date(batch.invoiceImportedAt), "MMM d, h:mm a")}`
                    : hasTrips
                      ? "Import invoice to reconcile"
                      : "Import trips first"}
                </p>
              </div>
            </div>
            <div>
              {hasInvoice ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                  Complete
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={hasTrips ? "default" : "outline"}
                  onClick={onImportInvoice}
                  disabled={!hasTrips}
                  className="w-full"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import
                </Button>
              )}
            </div>
          </div>

          {/* Summary Column */}
          <div className="p-5 space-y-3 border-t md:border-t-0">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  hasInvoice
                    ? "bg-emerald-100 dark:bg-emerald-950/40"
                    : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "text-lg font-bold",
                    hasInvoice ? "text-emerald-600" : "text-muted-foreground"
                  )}
                >
                  $
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(batch.projectedTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  projected revenue
                </p>
              </div>
            </div>

            {hasInvoice && batch.actualTotal !== null ? (
              <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actual</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    {formatCurrency(batch.actualTotal)}
                  </span>
                </div>
                {batch.variance !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Variance</span>
                    <span
                      className={cn(
                        "font-semibold",
                        batch.variance >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      )}
                    >
                      {batch.variance >= 0 ? "+" : ""}
                      {formatCurrency(batch.variance)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Awaiting invoice data
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
