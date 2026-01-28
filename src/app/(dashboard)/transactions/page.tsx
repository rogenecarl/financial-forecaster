"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, Upload, Receipt, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TransactionFilters,
  TransactionsTable,
  BulkActions,
  ImportModal,
  ImportPreview,
} from "@/components/transactions";
import {
  getTransactions,
  updateTransaction,
  deleteTransaction,
  bulkUpdateCategory,
  type TransactionWithCategory,
} from "@/actions/transactions";
import type { TransactionFilter, ImportTransactionRow } from "@/schema/transaction.schema";
import { toast } from "sonner";

export default function TransactionsPage() {
  // State
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Partial<TransactionFilter>>({
    page: 1,
    limit: 50,
    sortBy: "postingDate",
    sortOrder: "desc",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importData, setImportData] = useState<{
    transactions: ImportTransactionRow[];
    fileName: string;
    fileType: "CSV" | "XLSX";
  } | null>(null);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTransactions(filters);
      if (result.success && result.data) {
        setTransactions(result.data.transactions);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<TransactionFilter>) => {
    setFilters(newFilters);
    setSelectedIds([]); // Clear selection on filter change
  }, []);

  // Handle search (separate handler for debouncing)
  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({
      ...prev,
      search: search || undefined,
      page: 1,
    }));
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback(async (transactionId: string, categoryId: string | null) => {
    try {
      const result = await updateTransaction({
        id: transactionId,
        categoryId,
      });

      if (result.success) {
        // Update local state
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? { ...t, categoryId, category: result.data?.category || null, manualOverride: true, reviewStatus: "REVIEWED" }
              : t
          )
        );
        toast.success("Category updated");
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      toast.error("Failed to update category");
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (transactionId: string) => {
    try {
      const result = await deleteTransaction(transactionId);
      if (result.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
        setTotal((prev) => prev - 1);
        toast.success("Transaction deleted");
      } else {
        toast.error(result.error || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    }
  }, []);

  // Handle bulk categorize
  const handleBulkCategorize = useCallback(async (
    categoryId: string,
    createRule: boolean,
    rulePattern?: string
  ) => {
    try {
      const result = await bulkUpdateCategory({
        transactionIds: selectedIds,
        categoryId,
        createRule,
        rulePattern,
      });

      if (result.success) {
        toast.success(`Updated ${result.data?.updatedCount} transactions`);
        setSelectedIds([]);
        fetchTransactions();
      } else {
        toast.error(result.error || "Failed to update transactions");
      }
    } catch (error) {
      console.error("Failed to bulk categorize:", error);
      toast.error("Failed to update transactions");
    }
  }, [selectedIds, fetchTransactions]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    try {
      let deletedCount = 0;
      for (const id of selectedIds) {
        const result = await deleteTransaction(id);
        if (result.success) deletedCount++;
      }

      toast.success(`Deleted ${deletedCount} transactions`);
      setSelectedIds([]);
      fetchTransactions();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
      toast.error("Failed to delete transactions");
    }
  }, [selectedIds, fetchTransactions]);

  // Handle import
  const handleImport = useCallback((
    transactions: ImportTransactionRow[],
    fileName: string,
    fileType: "CSV" | "XLSX"
  ) => {
    setImportData({ transactions, fileName, fileType });
    setShowImportModal(false);
    setShowPreview(true);
  }, []);

  // Handle import complete
  const handleImportComplete = useCallback(() => {
    setShowPreview(false);
    setImportData(null);
    fetchTransactions();
  }, [fetchTransactions]);

  // Get sample description for bulk actions
  const sampleDescription = selectedIds.length > 0
    ? transactions.find((t) => t.id === selectedIds[0])?.description
    : undefined;

  const totalPages = Math.ceil(total / (filters.limit || 50));
  const hasTransactions = total > 0 || loading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Track and categorize your bank transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {hasTransactions ? (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <TransactionFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
              />
            </CardContent>
          </Card>

          {/* Table */}
          <TransactionsTable
            transactions={transactions}
            total={total}
            page={filters.page || 1}
            limit={filters.limit || 50}
            totalPages={totalPages}
            loading={loading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onCategoryChange={handleCategoryChange}
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onBulkCategorize={handleBulkCategorize}
            onBulkDelete={handleBulkDelete}
            sampleDescription={sampleDescription}
          />
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardHeader>
            <CardTitle>Bank Transactions</CardTitle>
            <CardDescription>
              Import your bank statement to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No transactions yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Import your bank transactions to get started with bookkeeping.
                We support CSV and Excel files.
              </p>
              <Button onClick={() => setShowImportModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Modal */}
      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={handleImport}
      />

      {/* Import Preview */}
      {importData && (
        <ImportPreview
          open={showPreview}
          onOpenChange={setShowPreview}
          transactions={importData.transactions}
          fileName={importData.fileName}
          fileType={importData.fileType}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
