"use client";

import { useState, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Construction,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { parseInvoiceFile, type InvoiceParseResult } from "@/lib/parsers/invoice-parser";
import {
  importInvoiceToBatch,
  checkDuplicateInvoiceFile,
  type InvoiceImportResult,
} from "@/actions/forecasting/amazon-invoices";
import { DuplicateFileWarningDialog } from "./duplicate-file-warning-dialog";
import { InvoiceImportResultDialog } from "./invoice-import-result-dialog";

interface InvoiceImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  batchId?: string;
  batchName?: string;
}

type ImportStage = "select" | "parsing" | "importing" | "complete" | "error";

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function InvoiceImportModal({
  open,
  onOpenChange,
  onSuccess,
  batchId,
  batchName,
}: InvoiceImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<ImportStage>("select");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<InvoiceParseResult | null>(null);
  const [importResult, setImportResult] = useState<InvoiceImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Duplicate file dialog
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateBatchName, setDuplicateBatchName] = useState<string>("");
  const [pendingFileHash, setPendingFileHash] = useState<string | null>(null);

  // Result dialog
  const [showResultDialog, setShowResultDialog] = useState(false);

  const resetState = useCallback(() => {
    setStage("select");
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setError(null);
    setProgress(0);
    setPendingFileHash(null);
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const processFile = useCallback(async (selectedFile: File, fileHash: string, skipDuplicateCheck = false) => {
    if (!batchId) {
      setError("No batch selected. Please select or create a batch first.");
      setStage("error");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Step 1: Check for duplicate file
    if (!skipDuplicateCheck) {
      setStage("parsing");
      setProgress(10);

      const duplicateCheck = await checkDuplicateInvoiceFile(batchId, fileHash);
      if (duplicateCheck.success && duplicateCheck.data?.isDuplicate) {
        setDuplicateBatchName(duplicateCheck.data.batchName || "another batch");
        setPendingFileHash(fileHash);
        setShowDuplicateWarning(true);
        setStage("select");
        return;
      }
    }

    // Step 2: Parse the file
    setStage("parsing");
    setProgress(20);

    const parsed = await parseInvoiceFile(selectedFile);
    setParseResult(parsed);
    setProgress(50);

    if (!parsed.success || !parsed.invoice || parsed.invoice.lineItems.length === 0) {
      setError(parsed.errors.join(", ") || "No valid invoice data found in file");
      setStage("error");
      return;
    }

    // Step 3: Import to batch
    setStage("importing");
    setProgress(70);

    const result = await importInvoiceToBatch(batchId, parsed.invoice, fileHash);
    setProgress(100);

    if (result.success && result.data) {
      setImportResult(result.data);
      setStage("complete");
      setShowResultDialog(true);
    } else if (!result.success) {
      // Check if it's a duplicate file error
      if (result.error?.startsWith("DUPLICATE_FILE:")) {
        const batchNameMatch = result.error.match(/batch "(.+)"/);
        setDuplicateBatchName(batchNameMatch?.[1] || "another batch");
        setPendingFileHash(fileHash);
        setShowDuplicateWarning(true);
        setStage("select");
      } else {
        setError(result.error || "Failed to import invoice");
        setStage("error");
      }
    }
  }, [batchId]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    // Validate file type
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setError("Please upload an Excel file (.xlsx or .xls)");
      setStage("error");
      return;
    }

    // Compute hash
    const fileHash = await computeFileHash(selectedFile);
    await processFile(selectedFile, fileHash);
  }, [processFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDuplicateConfirm = useCallback(async () => {
    setShowDuplicateWarning(false);
    if (file && pendingFileHash) {
      await processFile(file, pendingFileHash, true);
    }
  }, [file, pendingFileHash, processFile]);

  const handleResultClose = useCallback(() => {
    setShowResultDialog(false);
    onSuccess();
    handleClose();
  }, [onSuccess, handleClose]);

  // If no batchId, show a message to select a batch first
  if (!batchId) {
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
            <AlertTitle className="text-amber-800">Batch Required</AlertTitle>
            <AlertDescription className="text-amber-700 space-y-2">
              <p>
                Invoice imports are now managed through Trip Batches for better organization and matching.
              </p>
              <p className="text-sm">
                Please create or select a Trip Batch first, then import invoices to that batch.
              </p>
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

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Invoice</DialogTitle>
            <DialogDescription>
              Upload an Amazon Payment Details Excel file
              {batchName && (
                <span className="block mt-1 text-foreground font-medium">
                  to &quot;{batchName}&quot;
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input / Dropzone */}
            {stage === "select" && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  {isDragging
                    ? "Drop the file here"
                    : "Drag & drop an Excel file here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to select a file
                </p>
                <Button variant="outline" size="sm" className="mt-4" type="button">
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </div>
            )}

            {/* Progress */}
            {(stage === "parsing" || stage === "importing") && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    {stage === "parsing" ? "Parsing file..." : "Importing invoice..."}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                {file && (
                  <p className="text-xs text-muted-foreground">{file.name}</p>
                )}
              </div>
            )}

            {/* Error */}
            {stage === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success (brief - details in result dialog) */}
            {stage === "complete" && !showResultDialog && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800">Import Complete</AlertTitle>
                <AlertDescription className="text-emerald-700">
                  Successfully imported invoice to the batch.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-4">
            {stage === "select" && (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
            {stage === "error" && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={resetState}>Try Again</Button>
              </>
            )}
            {stage === "complete" && !showResultDialog && (
              <Button onClick={handleResultClose}>Done</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate File Warning Dialog */}
      <DuplicateFileWarningDialog
        open={showDuplicateWarning}
        onOpenChange={setShowDuplicateWarning}
        batchName={duplicateBatchName}
        onConfirm={handleDuplicateConfirm}
        onCancel={() => {
          setShowDuplicateWarning(false);
          resetState();
        }}
      />

      {/* Import Result Dialog */}
      {importResult && parseResult && (
        <InvoiceImportResultDialog
          open={showResultDialog}
          onOpenChange={setShowResultDialog}
          result={importResult}
          parseStats={parseResult.stats}
          warnings={parseResult.warnings}
          onClose={handleResultClose}
        />
      )}
    </>
  );
}
