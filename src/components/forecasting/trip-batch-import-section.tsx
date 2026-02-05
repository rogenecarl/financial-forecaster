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
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-24 mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
    <div className="grid gap-4 md:grid-cols-3">
      {/* Trips Import Card */}
      <Card
        className={cn(
          "relative overflow-hidden",
          hasTrips && "border-blue-200 bg-blue-50/30"
        )}
      >
        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                hasTrips ? "bg-blue-100" : "bg-slate-100"
              )}
            >
              <FileSpreadsheet
                className={cn(
                  "h-6 w-6",
                  hasTrips ? "text-blue-600" : "text-slate-500"
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold">Trips</h3>
              {hasTrips ? (
                <p className="text-sm text-muted-foreground">
                  {batch.tripCount} imported
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not imported</p>
              )}
            </div>

            {hasTrips && batch.tripsImportedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(batch.tripsImportedAt), "MMM d, h:mm a")}
              </p>
            )}

            {isLocked ? (
              <Button variant="outline" size="sm" disabled>
                <Lock className="mr-2 h-4 w-4" />
                Locked
              </Button>
            ) : hasTrips ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onImportTrips}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-import
                </Button>
                {onAddTrips && (
                  <Button variant="outline" size="sm" onClick={onAddTrips}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trip
                  </Button>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={onImportTrips}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Import Card */}
      <Card
        className={cn(
          "relative overflow-hidden",
          hasInvoice && "border-purple-200 bg-purple-50/30"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                hasInvoice ? "bg-purple-100" : "bg-slate-100"
              )}
            >
              <FileText
                className={cn(
                  "h-6 w-6",
                  hasInvoice ? "text-purple-600" : "text-slate-500"
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold">Invoice</h3>
              {hasInvoice ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Imported
                </p>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Pending
                </p>
              )}
            </div>

            {hasInvoice && batch.invoiceImportedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(batch.invoiceImportedAt), "MMM d, h:mm a")}
              </p>
            )}

            {hasInvoice ? (
              <Button variant="outline" size="sm" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                Complete
              </Button>
            ) : (
              <Button
                size="sm"
                variant={hasTrips ? "default" : "outline"}
                onClick={onImportInvoice}
                disabled={!hasTrips}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card
        className={cn(
          "relative overflow-hidden",
          hasInvoice
            ? "border-emerald-200 bg-emerald-50/30"
            : "border-slate-200"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                hasInvoice ? "bg-emerald-100" : "bg-slate-100"
              )}
            >
              <span
                className={cn(
                  "text-xl font-bold",
                  hasInvoice ? "text-emerald-600" : "text-slate-500"
                )}
              >
                $
              </span>
            </div>
            <div>
              <h3 className="font-semibold">Summary</h3>
              <p className="text-sm font-semibold text-emerald-700">
                {formatCurrency(batch.projectedTotal)}
              </p>
              <p className="text-xs text-muted-foreground">projected</p>
            </div>

            {hasInvoice && batch.actualTotal !== null && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-700">
                  {formatCurrency(batch.actualTotal)}
                </p>
                <p className="text-xs text-muted-foreground">actual</p>
                {batch.variance !== null && (
                  <p
                    className={cn(
                      "text-xs font-medium",
                      batch.variance >= 0 ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {batch.variance >= 0 ? "+" : ""}
                    {formatCurrency(batch.variance)}
                  </p>
                )}
              </div>
            )}

            {!hasInvoice && (
              <p className="text-xs text-muted-foreground">
                Actual: awaiting invoice
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
