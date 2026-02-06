"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
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
import { useDeleteTripBatch, type TripBatchSummary } from "@/hooks";

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
  const { deleteBatchAsync, isPending } = useDeleteTripBatch();

  const handleDelete = async () => {
    if (!batch) return;

    try {
      const result = await deleteBatchAsync(batch.id);
      toast.success(
        `Deleted batch "${batch.name}" with ${result.deletedTrips} trips and ${result.deletedInvoices} invoices`
      );
      onSuccess();
      onOpenChange(false);
    } catch {
      // Error toast is handled by the hook's onError
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
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Batch
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
