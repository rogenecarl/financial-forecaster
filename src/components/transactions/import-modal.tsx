"use client";

import { useState, useCallback } from "react";
import { FileSpreadsheet, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseFile, type ParseResult } from "@/lib/parsers";
import type { ImportTransactionRow } from "@/schema/transaction.schema";
import type { ImportMode } from "@/actions/transactions";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: ImportTransactionRow[], fileName: string, fileType: "CSV" | "XLSX") => void;
  mode?: ImportMode;
}

export function ImportModal({ open, onOpenChange, onImport, mode = "APPEND" }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParseWarnings([]);
    setLoading(true);

    try {
      const result: ParseResult = await parseFile(file);

      if (!result.success && result.transactions.length === 0) {
        setError(result.errors[0] || "Failed to parse file");
        setLoading(false);
        return;
      }

      if (result.warnings.length > 0) {
        setParseWarnings(result.warnings);
      }

      if (result.errors.length > 0 && result.transactions.length > 0) {
        setParseWarnings([...result.warnings, ...result.errors]);
      }

      const fileType = file.name.toLowerCase().endsWith(".xlsx") ||
                       file.name.toLowerCase().endsWith(".xls")
                       ? "XLSX" : "CSV";

      onImport(result.transactions, file.name, fileType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }, [onImport]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const resetState = () => {
    setError(null);
    setParseWarnings([]);
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetState();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "REPLACE" ? "Re-import Transactions" : "Import Bank Transactions"}</DialogTitle>
          <DialogDescription>
            {mode === "REPLACE"
              ? "Upload a CSV or Excel file. This will replace all existing transactions in this batch."
              : "Upload a CSV or Excel file. Duplicates will be skipped."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              disabled={loading}
            />

            <label
              htmlFor="file-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="p-3 rounded-full bg-slate-100 mb-3">
                <FileSpreadsheet className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {loading ? "Processing..." : "Drop your file here"}
              </p>
              <p className="text-xs text-slate-500 mb-3">or click to browse</p>
              <p className="text-xs text-slate-400">
                Supports: CSV, XLSX, XLS
              </p>
            </label>
          </div>

          {/* Expected format info */}
          <div className="text-xs text-slate-500 space-y-1 p-3 bg-slate-50 rounded-lg">
            <p className="font-medium text-slate-600">Expected columns:</p>
            <p>
              Details, Posting Date, Description, Amount, Type, Balance (optional),
              Categories (optional), Higher_Order_Category (optional)
            </p>
            <p className="text-slate-400 mt-1">
              If Categories column is present, transactions will be auto-categorized.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Import Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => setError(null)}>
                <X className="h-4 w-4 text-red-400 hover:text-red-600" />
              </button>
            </div>
          )}

          {/* Warnings */}
          {parseWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-1">Warnings</p>
              <ul className="text-xs text-amber-700 space-y-1">
                {parseWarnings.slice(0, 5).map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
                {parseWarnings.length > 5 && (
                  <li>...and {parseWarnings.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
