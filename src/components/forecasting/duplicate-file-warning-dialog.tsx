"use client";

import { format } from "date-fns";
import { AlertTriangle, Calendar, FileText, Package } from "lucide-react";
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

export interface PreviousImportInfo {
  importedAt: Date;
  fileName: string;
  itemCount: number;
  itemType: "trips" | "invoices" | "transactions";
}

interface DuplicateFileWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousImport: PreviousImportInfo;
  onContinue: () => void;
  onCancel: () => void;
}

export function DuplicateFileWarningDialog({
  open,
  onOpenChange,
  previousImport,
  onContinue,
  onCancel,
}: DuplicateFileWarningDialogProps) {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
  };

  const getSkipMessage = () => {
    switch (previousImport.itemType) {
      case "trips":
        return "Duplicate trips will be automatically skipped.";
      case "invoices":
        return "The invoice will be rejected if the invoice number already exists.";
      case "transactions":
        return "Duplicate transactions will be automatically skipped.";
      default:
        return "Duplicates will be automatically skipped.";
    }
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
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Previous Import:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(previousImport.importedAt), "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {previousImport.itemCount}{" "}
                    {previousImport.itemType === "trips"
                      ? "trips imported"
                      : previousImport.itemType === "invoices"
                      ? "invoices imported"
                      : "transactions imported"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{previousImport.fileName}</span>
                </div>
              </div>
            </div>

            <p className="text-sm">
              Do you want to continue anyway?
              <br />
              <span className="text-muted-foreground">{getSkipMessage()}</span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>Continue Import</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
