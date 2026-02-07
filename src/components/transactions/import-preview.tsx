"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Copy,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySelect } from "./category-select";
import { generateImportPreview, importTransactions, type ImportMode } from "@/actions/transactions";
import { getCategories } from "@/actions/settings/categories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ImportTransactionRow, ImportPreviewItem } from "@/schema/transaction.schema";
import type { Category } from "@/lib/generated/prisma/client";

interface ImportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: ImportTransactionRow[];
  fileName: string;
  fileType: "CSV" | "XLSX";
  onComplete: () => void;
  transactionBatchId?: string;
  mode?: ImportMode;
}

export function ImportPreview({
  open,
  onOpenChange,
  transactions,
  fileName,
  fileType,
  onComplete,
  transactionBatchId,
  mode = "APPEND",
}: ImportPreviewProps) {
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Fetch categories once on mount
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
      setCategoriesLoading(false);
    }
    loadCategories();
  }, []);

  // Generate preview on mount
  useEffect(() => {
    async function generatePreview() {
      if (!open || transactions.length === 0) return;

      setLoading(true);
      try {
        const result = await generateImportPreview(transactions, transactionBatchId, mode);
        if (result.success && result.data) {
          setPreviewItems(result.data);
          // Select all non-duplicates by default
          const nonDuplicates = new Set(
            result.data
              .filter((item) => !item.isDuplicate)
              .map((item) => item.rowIndex)
          );
          setSelectedItems(nonDuplicates);
        }
      } catch (err) {
        console.error("Failed to generate preview:", err);
        toast.error("Failed to generate preview");
      } finally {
        setLoading(false);
      }
    }

    generatePreview();
  }, [open, transactions, transactionBatchId, mode]);

  const handleImport = async () => {
    const itemsToImport = previewItems.filter((item) =>
      selectedItems.has(item.rowIndex)
    );

    if (itemsToImport.length === 0) {
      toast.error("No transactions selected for import");
      return;
    }

    setImporting(true);
    try {
      const result = await importTransactions(itemsToImport, fileName, fileType, transactionBatchId, mode);

      if (result.success) {
        let message = `Imported ${result.data.totalImported} transactions`;
        if (result.data.totalReplaced > 0) {
          message += ` (replaced ${result.data.totalReplaced} existing)`;
        }
        if (result.data.categoriesCreated > 0) {
          message += ` (${result.data.categoriesCreated} new categories created)`;
        }
        if (result.data.totalSkipped > 0) {
          message += ` (${result.data.totalSkipped} duplicates skipped)`;
        }
        toast.success(message);
        onComplete();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to import transactions");
    } finally {
      setImporting(false);
    }
  };

  const handleCategoryChange = (rowIndex: number, categoryId: string | null) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.rowIndex === rowIndex
          ? {
              ...item,
              suggestedCategoryId: categoryId,
              suggestedCategoryName: categories.find(c => c.id === categoryId)?.name || null,
              confidence: 1,
            }
          : item
      )
    );
  };

  const toggleItem = (rowIndex: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  const selectAll = () => {
    const nonDuplicates = previewItems
      .filter((item) => !item.isDuplicate)
      .map((item) => item.rowIndex);
    setSelectedItems(new Set(nonDuplicates));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  // Stats
  const totalCount = previewItems.length;
  const duplicateCount = previewItems.filter((i) => i.isDuplicate).length;
  const categorizedCount = previewItems.filter(
    (i) => i.suggestedCategoryId && !i.isDuplicate
  ).length;
  const selectedCount = selectedItems.size;
  const uncategorizedCount = totalCount - duplicateCount - categorizedCount;

  // Check if CSV has higher category column
  const hasCsvHigherCategory = previewItems.some(
    (i) => i.transaction.csvHigherCategory
  );

  const displayItems = showDuplicates
    ? previewItems
    : previewItems.filter((item) => !item.isDuplicate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{mode === "REPLACE" ? "Preview Re-import" : "Preview Import"}</DialogTitle>
          <DialogDescription>
            {mode === "REPLACE"
              ? "Existing transactions in this batch will be replaced. Review before proceeding."
              : "Review and categorize transactions before importing"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-slate-500">Analyzing transactions...</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="flex flex-wrap gap-4 py-4 border-b">
              <div className="text-sm">
                <span className="font-medium">{totalCount}</span>
                <span className="text-slate-500"> total</span>
              </div>
              {duplicateCount > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-amber-600">{duplicateCount}</span>
                  <span className="text-slate-500"> duplicates</span>
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium text-green-600">{categorizedCount}</span>
                <span className="text-slate-500"> categorized</span>
              </div>
              {uncategorizedCount > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-orange-600">{uncategorizedCount}</span>
                  <span className="text-slate-500"> need category</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
              {duplicateCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDuplicates(!showDuplicates)}
                  className="gap-1"
                >
                  {showDuplicates ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Duplicates
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show {duplicateCount} Duplicates
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Table */}
            <ScrollArea className="h-[calc(90vh-350px)] min-h-[200px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-28 text-right">Amount</TableHead>
                    {hasCsvHigherCategory && (
                      <TableHead className="w-16 text-center">Type</TableHead>
                    )}
                    <TableHead className="w-[200px]">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item) => (
                    <TableRow
                      key={item.rowIndex}
                      className={cn(
                        item.isDuplicate && "bg-amber-50 opacity-60",
                        selectedItems.has(item.rowIndex) && !item.isDuplicate && "bg-blue-50"
                      )}
                    >
                      <TableCell>
                        {item.isDuplicate ? (
                          <Badge variant="outline" className="text-xs">
                            <Copy className="h-3 w-3 mr-1" />
                            Dup
                          </Badge>
                        ) : (
                          <Checkbox
                            checked={selectedItems.has(item.rowIndex)}
                            onCheckedChange={() => toggleItem(item.rowIndex)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(item.transaction.postingDate)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[280px]">
                          {item.transaction.description}
                        </p>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm",
                          item.transaction.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {formatAmount(item.transaction.amount)}
                      </TableCell>
                      {hasCsvHigherCategory && (
                        <TableCell className="text-center">
                          {item.transaction.csvHigherCategory ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5",
                                item.transaction.csvHigherCategory === "Revenue" && "border-green-500 text-green-700 bg-green-50",
                                item.transaction.csvHigherCategory === "Contra-Revenue" && "border-orange-500 text-orange-700 bg-orange-50",
                                item.transaction.csvHigherCategory === "Cost of Goods Sold" && "border-red-500 text-red-700 bg-red-50",
                                item.transaction.csvHigherCategory === "Operating Expenses" && "border-blue-500 text-blue-700 bg-blue-50",
                                item.transaction.csvHigherCategory === "Equity" && "border-purple-500 text-purple-700 bg-purple-50"
                              )}
                            >
                              {item.transaction.csvHigherCategory === "Cost of Goods Sold"
                                ? "COGS"
                                : item.transaction.csvHigherCategory === "Operating Expenses"
                                ? "OpEx"
                                : item.transaction.csvHigherCategory}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="overflow-visible">
                        {item.isDuplicate ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <CategorySelect
                            value={item.suggestedCategoryId}
                            onValueChange={(categoryId) =>
                              handleCategoryChange(item.rowIndex, categoryId)
                            }
                            categories={categories}
                            loading={categoriesLoading}
                            className="w-full h-8 text-xs"
                            placeholder="Select category..."
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Info box */}
            {uncategorizedCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="text-amber-800">
                  <strong>{uncategorizedCount}</strong> transactions need a category assigned before import.
                </p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || importing || selectedCount === 0}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Import {selectedCount} Transactions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
