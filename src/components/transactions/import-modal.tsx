"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, ClipboardPaste, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseFile, parseText, type ParseResult } from "@/lib/parsers";
import type { ImportTransactionRow } from "@/schema/transaction.schema";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: ImportTransactionRow[], fileName: string, fileType: "CSV" | "XLSX") => void;
}

export function ImportModal({ open, onOpenChange, onImport }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
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

  const handlePaste = useCallback(() => {
    if (!pasteContent.trim()) {
      setError("Please paste some data first");
      return;
    }

    setError(null);
    setParseWarnings([]);
    setLoading(true);

    try {
      const result = parseText(pasteContent);

      if (!result.success && result.transactions.length === 0) {
        setError(result.errors[0] || "Failed to parse pasted data");
        setLoading(false);
        return;
      }

      if (result.warnings.length > 0) {
        setParseWarnings(result.warnings);
      }

      onImport(result.transactions, "pasted-data.csv", "CSV");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse pasted data");
    } finally {
      setLoading(false);
    }
  }, [pasteContent, onImport]);

  const resetState = () => {
    setError(null);
    setParseWarnings([]);
    setPasteContent("");
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Bank Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file from your bank, or paste transaction data directly.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Paste Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
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
                accept=".csv,.xlsx,.xls,.txt"
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
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-medium">Expected columns:</p>
              <p>
                Details (DEBIT/CREDIT), Posting Date, Description, Amount, Type,
                Balance (optional), Check # (optional)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder="Paste your bank transaction data here (tab or comma separated)..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />

            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                Include header row with column names
              </p>
              <Button onClick={handlePaste} disabled={loading || !pasteContent.trim()}>
                {loading ? "Processing..." : "Parse & Preview"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

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
      </DialogContent>
    </Dialog>
  );
}
