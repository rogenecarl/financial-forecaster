"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Truck,
  AlertTriangle,
  DollarSign,
  ChevronDown,
  ChevronRight,
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
import type { InvoiceImportResult } from "@/actions/forecasting/amazon-invoices";
import type { InvoiceParseResult } from "@/lib/parsers/invoice-parser";

interface InvoiceImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: InvoiceImportResult;
  parseStats: InvoiceParseResult["stats"];
  warnings: string[];
  onClose: () => void;
  projectedTotal?: number;
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

export function InvoiceImportResultDialog({
  open,
  onOpenChange,
  result,
  parseStats,
  warnings,
  onClose,
}: InvoiceImportResultDialogProps) {
  const [showWarnings, setShowWarnings] = useState(false);

  const handleClose = () => {
    onClose();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Import Complete
          </DialogTitle>
          <DialogDescription>
            Successfully imported invoice with {parseStats.totalRows} line items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Summary */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" />
              Import Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line items:</span>
                <span className="font-medium">{formatNumber(result.lineItemCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tours:</span>
                <span className="font-medium">{formatNumber(parseStats.tourCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loads:</span>
                <span className="font-medium">{formatNumber(parseStats.loadCount)}</span>
              </div>
              {parseStats.adjustmentCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adjustments:</span>
                  <span className="font-medium">{formatNumber(parseStats.adjustmentCount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Trip Matching */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Truck className="h-4 w-4" />
              Trip Matching
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Matched:
                </span>
                <span className="font-medium text-green-600">
                  {formatNumber(result.matchedTrips)} trips
                </span>
              </div>
              {result.unmatchedTrips > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Unmatched:
                  </span>
                  <span className="font-medium text-amber-600">
                    {formatNumber(result.unmatchedTrips)} trips
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
              <DollarSign className="h-4 w-4" />
              Revenue Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tour Pay:</span>
                <span className="font-medium">{formatCurrency(parseStats.totalTourPay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accessorials:</span>
                <span className="font-medium">{formatCurrency(parseStats.totalAccessorials)}</span>
              </div>
              {parseStats.totalAdjustments !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adjustments:</span>
                  <span className={`font-medium ${parseStats.totalAdjustments < 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(parseStats.totalAdjustments)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(parseStats.totalPay)}
                </span>
              </div>
            </div>
          </div>

          {/* Match Status Message */}
          {result.unmatchedTrips > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-amber-800 dark:text-amber-200">
                <strong>{result.unmatchedTrips}</strong> line items reference trips that
                don&apos;t exist in this batch. These may be from a previous period.
              </p>
            </div>
          )}

          {result.matchedTrips > 0 && result.unmatchedTrips === 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20">
              <p className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                All line items were matched. Actual revenue has been updated.
              </p>
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
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
