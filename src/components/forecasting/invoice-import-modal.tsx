"use client";

import { Construction } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface InvoiceImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  batchId?: string;
}

/**
 * Invoice Import Modal - Stub for Phase 1
 * This modal will be redesigned in Phase 2 to work with Trip Batches.
 * Invoices must be imported within the context of a Trip Batch.
 */
export function InvoiceImportModal({ open, onOpenChange, batchId }: InvoiceImportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Invoice</DialogTitle>
          <DialogDescription>
            Upload an Amazon invoice file
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50/50">
          <Construction className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Feature Being Redesigned</AlertTitle>
          <AlertDescription className="text-amber-700 space-y-2">
            <p>
              Invoice imports are now managed through Trip Batches for better organization and matching.
            </p>
            {!batchId && (
              <p className="text-sm">
                Please create or select a Trip Batch first, then import invoices to that batch.
              </p>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
