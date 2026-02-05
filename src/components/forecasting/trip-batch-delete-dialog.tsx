"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteTripBatch,
  type TripBatchSummary,
} from "@/actions/forecasting/trip-batches";

interface TripBatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: TripBatchSummary | null;
  onSuccess: () => void;
}

export function TripBatchDeleteDialog({
  open,
  onOpenChange,
  batch,
  onSuccess,
}: TripBatchDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!batch) return;

    setDeleting(true);
    try {
      const result = await deleteTripBatch(batch.id);

      if (result.success && result.data) {
        toast.success(
          `Deleted batch "${batch.name}" with ${result.data.deletedTrips} trips and ${result.data.deletedInvoices} invoices`
        );
        onSuccess();
        onOpenChange(false);
      } else if (!result.success) {
        toast.error(result.error || "Failed to delete batch");
      }
    } catch {
      toast.error("Failed to delete batch");
    } finally {
      setDeleting(false);
    }
  };

  if (!batch) return null;

  const hasData = batch.tripCount > 0 || batch.status === "INVOICED";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Batch
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>&quot;{batch.name}&quot;</strong>?
              </p>

              {hasData && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                  <p className="font-medium">This will permanently delete:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {batch.tripCount > 0 && (
                      <li>
                        {batch.tripCount} trip{batch.tripCount !== 1 ? "s" : ""}{" "}
                        and their loads
                      </li>
                    )}
                    {batch.status === "INVOICED" && (
                      <li>Associated invoice data</li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Batch
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
