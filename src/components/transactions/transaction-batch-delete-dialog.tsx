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
import { useDeleteTransactionBatch, type TransactionBatchSummary } from "@/hooks";

interface TransactionBatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: TransactionBatchSummary | null;
  onSuccess: () => void;
}

export function TransactionBatchDeleteDialog({
  open,
  onOpenChange,
  batch,
  onSuccess,
}: TransactionBatchDeleteDialogProps) {
  const { deleteBatchAsync, isPending } = useDeleteTransactionBatch();

  const handleDelete = async () => {
    if (!batch) return;

    try {
      const result = await deleteBatchAsync(batch.id);
      toast.success(
        `Deleted batch "${batch.name}" and ${result.deletedTransactions} transaction${result.deletedTransactions !== 1 ? "s" : ""}`
      );
      onSuccess();
      onOpenChange(false);
    } catch {
      // Error toast is handled by the hook's onError
    }
  };

  if (!batch) return null;

  const hasData = batch.transactionCount > 0;

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
                  <p className="font-medium">This batch contains {batch.transactionCount} transaction{batch.transactionCount !== 1 ? "s" : ""}.</p>
                  <p className="mt-1">
                    All transactions in this batch will be <strong>permanently deleted</strong>.
                  </p>
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
