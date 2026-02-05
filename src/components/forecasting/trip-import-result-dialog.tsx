"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  ChevronDown,
  ChevronRight,
  SkipForward,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  MapPin,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";
import type { TripImportResult } from "@/actions/forecasting/trip-batches";
import type { TripsParseResult } from "@/lib/parsers/trips-parser";

interface TripImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TripImportResult;
  parseStats: TripsParseResult["stats"];
  warnings: string[];
  onClose: () => void;
  mode?: "REPLACE" | "APPEND";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function TripImportResultDialog({
  open,
  onOpenChange,
  result,
  parseStats,
  warnings,
  onClose,
  mode = "REPLACE",
}: TripImportResultDialogProps) {
  const [showSkipped, setShowSkipped] = useState(false);
  const [showSkippedInBatch, setShowSkippedInBatch] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  const { DTR_RATE, TRIP_ACCESSORIAL_RATE } = FORECASTING_CONSTANTS;

  const handleClose = () => {
    onClose();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Import Complete
          </DialogTitle>
          <DialogDescription>
            Successfully processed {parseStats.totalRows} rows from the CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Summary */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4" />
              Import Summary
            </h4>
            <div className="space-y-2 text-sm">
              {mode === "REPLACE" && result.replaced > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replaced:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatNumber(result.replaced)} previous trips
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {mode === "APPEND" ? "Added:" : "Imported:"}
                </span>
                <span className="font-medium text-green-600">
                  {formatNumber(result.imported)} trips
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Projected Stops:
                </span>
                <span className="font-medium">
                  {formatNumber(result.projectedStops)} stops
                </span>
              </div>
              {result.canceledCount > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    Canceled:
                  </span>
                  <span className="font-medium text-red-600">
                    {formatNumber(result.canceledCount)} trips
                  </span>
                </div>
              )}
              {result.skippedInBatch > 0 && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <SkipForward className="h-3.5 w-3.5" />
                    Skipped (already in batch):
                  </span>
                  <span className="font-medium text-amber-600">
                    {formatNumber(result.skippedInBatch)} trips
                  </span>
                </div>
              )}
              {result.skipped > 0 && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <SkipForward className="h-3.5 w-3.5" />
                    Skipped (in other batches):
                  </span>
                  <span className="font-medium text-amber-600">
                    {formatNumber(result.skipped)} trips
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trip Summary */}
          {result.projectedTours > 0 && (
            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                <ClipboardList className="h-4 w-4" />
                Trip Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    Projected Loads:
                  </span>
                  <span className="font-medium">
                    {formatNumber(result.activeLoadCount)} loads
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Projected Stops:
                  </span>
                  <span className="font-medium">
                    {formatNumber(result.projectedStops)} stops
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Projected Revenue */}
          {result.projectedTours > 0 && (
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                <DollarSign className="h-4 w-4" />
                Projected Revenue (New Trips)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trip Completed Payout:</span>
                  <span className="font-medium">
                    {formatCurrency(result.projectedTourPay)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({result.projectedTours} x {formatCurrency(DTR_RATE)})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projected Loads Accessorial Payout:</span>
                  <span className="font-medium">
                    {formatCurrency(result.projectedAccessorials)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({result.projectedTours} x {formatCurrency(TRIP_ACCESSORIAL_RATE)})
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Projected:</span>
                  <span className="font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(result.projectedTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warnings Collapsible */}
          {warnings.length > 0 && (
            <Collapsible open={showWarnings} onOpenChange={setShowWarnings}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm text-amber-600"
                >
                  {showWarnings ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <AlertTriangle className="h-4 w-4" />
                  Show warnings ({warnings.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-24 rounded-lg border bg-amber-50/50 p-2">
                  <div className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <p key={idx} className="text-xs text-amber-700">
                        {warning}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Skipped In-Batch Trips Collapsible */}
          {result.skippedInBatch > 0 && result.duplicateInBatchTripIds.length > 0 && (
            <Collapsible open={showSkippedInBatch} onOpenChange={setShowSkippedInBatch}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-amber-600">
                  {showSkippedInBatch ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Show skipped (already in batch) ({result.skippedInBatch})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-32 rounded-lg border bg-amber-50/50 p-2">
                  <div className="space-y-1">
                    {result.duplicateInBatchTripIds.map((tripId) => (
                      <div
                        key={tripId}
                        className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
                      >
                        <span className="font-mono text-xs">{tripId}</span>
                        <span className="text-xs text-amber-600">
                          already in this batch
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Skipped Other-Batch Trips Collapsible */}
          {result.skipped > 0 && result.duplicateTripIds.length > 0 && (
            <Collapsible open={showSkipped} onOpenChange={setShowSkipped}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  {showSkipped ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Show skipped (other batches) ({result.skipped})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-32 rounded-lg border bg-muted/30 p-2">
                  <div className="space-y-1">
                    {result.duplicateTripIds.map((tripId) => (
                      <div
                        key={tripId}
                        className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
                      >
                        <span className="font-mono text-xs">{tripId}</span>
                        <span className="text-xs text-muted-foreground">
                          exists in another batch
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
