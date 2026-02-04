"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  FileText,
  Package,
  Truck,
  XCircle,
  ChevronDown,
  ChevronRight,
  SkipForward,
  DollarSign,
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";
import type { TripImportResult } from "@/actions/forecasting/trip-batches";

interface TripImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TripImportResult;
  fileName: string;
  onViewTrips?: () => void;
}

export function TripImportResultDialog({
  open,
  onOpenChange,
  result,
  fileName,
  onViewTrips,
}: TripImportResultDialogProps) {
  const [showSkipped, setShowSkipped] = useState(false);

  const { DTR_RATE, TRIP_ACCESSORIAL_RATE } = FORECASTING_CONSTANTS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Import Complete
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
            </div>
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
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active Trips:
                </span>
                <span className="font-medium text-green-600">
                  {formatNumber(result.imported - result.canceledCount)} trips
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  Projected Loads:
                </span>
                <span className="font-medium">{formatNumber(result.projectedLoads)} loads</span>
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
              {result.skipped > 0 && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <SkipForward className="h-3.5 w-3.5" />
                    Skipped:
                  </span>
                  <span className="font-medium text-amber-600">
                    {formatNumber(result.skipped)} trips (already exist)
                  </span>
                </div>
              )}
            </div>
            {result.canceledCount > 0 && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Note: {result.canceledCount} canceled {result.canceledCount === 1 ? "trip is" : "trips are"} excluded from active trips and projected loads
              </p>
            )}
          </div>

          {/* Projected Revenue */}
          {result.imported > 0 && (
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                <DollarSign className="h-4 w-4" />
                Projected Revenue (New Trips Only)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tour Pay:</span>
                  <span className="font-medium">
                    {formatCurrency(result.projectedTourPay)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({result.projectedTours} x {formatCurrency(DTR_RATE)})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accessorials:</span>
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

          {/* Skipped Trips Collapsible */}
          {result.skipped > 0 && result.duplicateTripIds.length > 0 && (
            <Collapsible open={showSkipped} onOpenChange={setShowSkipped}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  {showSkipped ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Show skipped trips ({result.skipped})
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
                          already imported
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onViewTrips && (
            <Button variant="outline" onClick={onViewTrips}>
              View Trips
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
