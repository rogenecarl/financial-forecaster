"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Copy,
  Sparkles,
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
import { generateImportPreview, importTransactions } from "@/actions/transactions";
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
}

export function ImportPreview({
  open,
  onOpenChange,
  transactions,
  fileName,
  fileType,
  onComplete,
}: ImportPreviewProps) {
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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
        const result = await generateImportPreview(transactions);
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
  }, [open, transactions]);

  // Run AI categorization for items without rule matches
  const runAICategorization = useCallback(async () => {
    const uncategorized = previewItems.filter(
      (item) => !item.suggestedCategoryId && !item.isDuplicate
    );

    if (uncategorized.length === 0) {
      toast.info("All transactions are already categorized");
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: uncategorized.map((item) => ({
            rowIndex: item.rowIndex,
            transaction: item.transaction,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("AI categorization failed");
      }

      const data = await response.json();

      // Update preview items with AI results
      setPreviewItems((prev) =>
        prev.map((item) => {
          const aiResult = data.results?.find(
            (r: { rowIndex: number }) => r.rowIndex === item.rowIndex
          );
          if (aiResult && aiResult.categoryId) {
            return {
              ...item,
              suggestedCategoryId: aiResult.categoryId,
              suggestedCategoryName: aiResult.categoryName,
              confidence: aiResult.confidence,
            };
          }
          return item;
        })
      );

      toast.success(`AI categorized ${data.results?.length || 0} transactions`);
    } catch (err) {
      console.error("AI categorization error:", err);
      toast.error("Failed to run AI categorization");
    } finally {
      setAiLoading(false);
    }
  }, [previewItems]);

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
      const result = await importTransactions(itemsToImport, fileName, fileType);

      if (result.success) {
        toast.success(
          `Imported ${result.data.totalImported} transactions` +
            (result.data.totalSkipped > 0
              ? ` (${result.data.totalSkipped} duplicates skipped)`
              : "")
        );
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

  const handleCategoryChange = (rowIndex: number, categoryId: string | null, categoryName: string | null) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.rowIndex === rowIndex
          ? {
              ...item,
              suggestedCategoryId: categoryId,
              suggestedCategoryName: categoryName,
              confidence: 1, // Manual selection = 100% confidence
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
  const highConfidenceCount = previewItems.filter(
    (i) => i.confidence >= 0.8 && !i.isDuplicate
  ).length;

  const displayItems = showDuplicates
    ? previewItems
    : previewItems.filter((item) => !item.isDuplicate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview Import</DialogTitle>
          <DialogDescription>
            Review and categorize transactions before importing
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
              <div className="text-sm">
                <span className="font-medium text-blue-600">{highConfidenceCount}</span>
                <span className="text-slate-500"> high confidence (≥80%)</span>
              </div>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={runAICategorization}
                disabled={aiLoading}
                className="gap-2"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Categorize
              </Button>
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
            <ScrollArea className="h-[calc(90vh-380px)] min-h-[200px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24 text-right">Amount</TableHead>
                    <TableHead className="w-[180px]">Category</TableHead>
                    <TableHead className="w-20">Conf.</TableHead>
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
                        <p className="text-sm truncate max-w-[300px]">
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
                      <TableCell>
                        {item.isDuplicate ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <CategorySelect
                            value={item.suggestedCategoryId}
                            onValueChange={(categoryId) =>
                              handleCategoryChange(item.rowIndex, categoryId, null)
                            }
                            categories={categories}
                            loading={categoriesLoading}
                            className="w-full h-8 text-xs"
                            placeholder="Select..."
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isDuplicate ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : item.confidence > 0 ? (
                          <div className="flex items-center gap-1">
                            {item.matchedRule ? (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5"
                              >
                                Rule
                              </Badge>
                            ) : (
                              <Badge
                                variant={
                                  item.confidence >= 0.8
                                    ? "default"
                                    : item.confidence >= 0.5
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs px-1.5"
                              >
                                {Math.round(item.confidence * 100)}%
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
              <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800">
                  <strong>{highConfidenceCount}</strong> transactions will be
                  auto-categorized (≥80% confidence).
                </p>
                <p className="text-blue-600">
                  {totalCount - duplicateCount - highConfidenceCount > 0 && (
                    <>
                      <strong>{totalCount - duplicateCount - highConfidenceCount}</strong>{" "}
                      will need manual review.
                    </>
                  )}
                </p>
              </div>
            </div>
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
