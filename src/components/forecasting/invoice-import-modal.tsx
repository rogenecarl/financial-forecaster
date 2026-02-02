"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseInvoiceFile, type InvoiceParseResult } from "@/lib/parsers/invoice-parser";
import { importAmazonInvoice, checkDuplicateInvoiceFile, type InvoiceImportResult } from "@/actions/forecasting";
import { toast } from "sonner";
import { calculateFileHash } from "@/lib/utils";
import { InvoiceImportResultDialog } from "./invoice-import-result-dialog";
import { DuplicateFileWarningDialog, type PreviousImportInfo } from "./duplicate-file-warning-dialog";

interface InvoiceImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "importing";

export function InvoiceImportModal({ open, onOpenChange, onSuccess }: InvoiceImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<InvoiceParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("invoice.xlsx");
  const [fileHash, setFileHash] = useState<string | undefined>(undefined);

  // Dialog states
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importResult, setImportResult] = useState<InvoiceImportResult | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [previousImportInfo, setPreviousImportInfo] = useState<PreviousImportInfo | null>(null);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);

    // Calculate file hash for duplicate detection
    try {
      const hash = await calculateFileHash(file);
      setFileHash(hash);

      // Check for duplicate file
      const duplicateCheck = await checkDuplicateInvoiceFile(hash);
      if (duplicateCheck.success && duplicateCheck.data?.isDuplicate && duplicateCheck.data.previousImport) {
        setPreviousImportInfo({
          importedAt: duplicateCheck.data.previousImport.importedAt,
          fileName: duplicateCheck.data.previousImport.fileName,
          itemCount: duplicateCheck.data.previousImport.invoiceCount,
          itemType: "invoices",
        });
        setShowDuplicateWarning(true);
      }
    } catch {
      // If hash calculation fails, continue without it
      console.warn("Failed to calculate file hash");
    }

    const result = await parseInvoiceFile(file);
    setParseResult(result);

    if (result.success && result.invoice) {
      setStep("preview");
    } else {
      toast.error("Failed to parse file");
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleImport = async () => {
    if (!parseResult?.invoice) return;

    setStep("importing");

    try {
      // Pass file hash only if we haven't already confirmed duplicate warning
      const hashToPass = skipDuplicateCheck ? undefined : fileHash;
      const result = await importAmazonInvoice(parseResult.invoice, fileName, hashToPass);

      if (result.success) {
        setImportResult(result.data!);
        setShowResultDialog(true);
        onSuccess();
      } else {
        // Handle duplicate file error specially
        if (result.error?.startsWith("DUPLICATE_FILE:")) {
          toast.error(result.error.replace("DUPLICATE_FILE: ", ""));
        } else {
          toast.error(result.error || "Failed to import invoice");
        }
        setStep("preview");
      }
    } catch {
      toast.error("Failed to import invoice");
      setStep("preview");
    }
  };

  const handleDuplicateWarningContinue = () => {
    setSkipDuplicateCheck(true);
    setShowDuplicateWarning(false);
  };

  const handleDuplicateWarningCancel = () => {
    setShowDuplicateWarning(false);
    handleClose();
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    setImportResult(null);
    handleClose();
  };

  const handleClose = () => {
    setStep("upload");
    setParseResult(null);
    setFileName("invoice.xlsx");
    setFileHash(undefined);
    setSkipDuplicateCheck(false);
    setPreviousImportInfo(null);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Amazon Invoice</DialogTitle>
          <DialogDescription>
            Upload an Amazon Payment Details Excel file (.xlsx)
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">
                Drop your Excel file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports: .xlsx, .xls (Payment Details tab)
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription>
                Use the &quot;Payment Details&quot; tab from your Amazon Relay invoice, not the &quot;Payment Summary&quot;.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "preview" && parseResult?.invoice && (
          <div className="space-y-4">
            <Alert variant="default" className="border-emerald-200 bg-emerald-50/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">File Parsed Successfully</AlertTitle>
              <AlertDescription className="text-emerald-700">
                Found {parseResult.stats.totalRows} line items
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{parseResult.invoice.invoiceNumber}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Pay</p>
                <p className="font-medium text-emerald-600">
                  {formatCurrency(parseResult.stats.totalPay)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{parseResult.stats.tourCount}</p>
                <p className="text-muted-foreground">Tours</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseResult.stats.totalTourPay)}
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{parseResult.stats.loadCount}</p>
                <p className="text-muted-foreground">Loads</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseResult.stats.totalAccessorials)}
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="font-semibold">{parseResult.stats.adjustmentCount}</p>
                <p className="text-muted-foreground">Adjustments</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseResult.stats.totalAdjustments)}
                </p>
              </div>
            </div>

            {parseResult.warnings.length > 0 && (
              <Alert variant="default" className="border-amber-200 bg-amber-50/50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Warnings</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <ul className="list-disc list-inside text-xs mt-1">
                    {parseResult.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parseResult.warnings.length > 3 && (
                      <li>...and {parseResult.warnings.length - 3} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import Invoice
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Importing invoice...</p>
          </div>
        )}
      </DialogContent>

      {/* Import Result Dialog */}
      {importResult && (
        <InvoiceImportResultDialog
          open={showResultDialog}
          onOpenChange={handleResultDialogClose}
          result={importResult}
          fileName={fileName}
        />
      )}

      {/* Duplicate File Warning Dialog */}
      {previousImportInfo && (
        <DuplicateFileWarningDialog
          open={showDuplicateWarning}
          onOpenChange={setShowDuplicateWarning}
          previousImport={previousImportInfo}
          onContinue={handleDuplicateWarningContinue}
          onCancel={handleDuplicateWarningCancel}
        />
      )}
    </Dialog>
  );
}
