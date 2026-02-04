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

interface TripsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  batchId?: string;
}

/**
 * Trips Import Modal - Stub for Phase 1
 * This modal will be redesigned in Phase 2 to work with Trip Batches.
 * Trips must be imported within the context of a Trip Batch.
 */
export function TripsImportModal({ open, onOpenChange, batchId }: TripsImportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Trips</DialogTitle>
          <DialogDescription>
            Upload an Amazon Scheduler CSV file
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50/50">
          <Construction className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Feature Being Redesigned</AlertTitle>
          <AlertDescription className="text-amber-700 space-y-2">
            <p>
              Trip imports are now managed through Trip Batches for better organization.
            </p>
            {!batchId && (
              <p className="text-sm">
                Please create or select a Trip Batch first, then import trips to that batch.
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
