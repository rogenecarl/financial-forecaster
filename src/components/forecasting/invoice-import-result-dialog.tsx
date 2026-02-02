"use client";

import { format } from "date-fns";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Truck,
  AlertTriangle,
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
import { formatNumber } from "@/lib/utils";
import type { InvoiceImportResult } from "@/actions/forecasting/amazon-invoices";

interface InvoiceImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: InvoiceImportResult;
  fileName: string;
  onViewInvoices?: () => void;
}

export function InvoiceImportResultDialog({
  open,
  onOpenChange,
  result,
  fileName,
  onViewInvoices,
}: InvoiceImportResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Import Complete
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
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
              <FileText className="h-4 w-4" />
              Import Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line items:</span>
                <span className="font-medium">{formatNumber(result.lineItemCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-green-600">
                  <Truck className="h-3.5 w-3.5" />
                  Trips matched:
                </span>
                <span className="font-medium text-green-600">
                  {formatNumber(result.matchedTrips)}
                </span>
              </div>
              {result.unmatchedTrips > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Unmatched trips:
                  </span>
                  <span className="font-medium text-amber-600">
                    {formatNumber(result.unmatchedTrips)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Match Status */}
          {result.unmatchedTrips > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-amber-800 dark:text-amber-200">
                <strong>{result.unmatchedTrips}</strong> line items reference trips that don&apos;t exist in the system.
                These may be from a previous period or trips that weren&apos;t imported.
              </p>
            </div>
          )}

          {result.matchedTrips > 0 && result.unmatchedTrips === 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20">
              <p className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <DollarSign className="h-4 w-4" />
                All line items were matched to existing trips. Actual revenue has been updated.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onViewInvoices && (
            <Button variant="outline" onClick={onViewInvoices}>
              View Invoices
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
