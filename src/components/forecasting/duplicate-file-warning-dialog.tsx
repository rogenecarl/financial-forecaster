"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DuplicateFileWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateFileWarningDialog({
  open,
  onOpenChange,
  batchName,
  onConfirm,
  onCancel,
}: DuplicateFileWarningDialogProps) {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Duplicate File Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>This file appears to have been imported before.</p>

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm">
                Previously imported to:{" "}
                <span className="font-semibold text-foreground">{batchName}</span>
              </p>
            </div>

            <p className="text-sm">
              Do you want to continue anyway?
              <br />
              <span className="text-muted-foreground">
                Duplicate items will be automatically skipped.
              </span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Continue Import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
