"use client";

import { useState, useCallback } from "react";
import { Download, Upload, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TransactionFilters,
  TransactionsTable,
  BulkActions,
  ImportModal,
  ImportPreview,
} from "@/components/transactions";
import { useTransactions } from "@/hooks";
import type { TransactionFilter, ImportTransactionRow } from "@/schema/transaction.schema";

export default function TransactionsPage() {
  // Filters state
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

  // Use TanStack Query hook for transactions
  const {
    transactions,
    total,
    totalPages,
    categories,
    transactionsLoading,
    categoriesLoading,
    updateCategory,
    deleteTransaction,
    bulkDelete,
    bulkCategorize,
    isBulkDeleting,
    isBulkCategorizing,
    invalidate,
  } = useTransactions({ filters });

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
  const handleCategoryChange = useCallback(
    (transactionId: string, categoryId: string | null) => {
      updateCategory(transactionId, categoryId);
    },
    [updateCategory]
  );

  // Handle delete
  const handleDelete = useCallback(
    (transactionId: string) => {
      deleteTransaction(transactionId);
    },
    [deleteTransaction]
  );

  // Handle bulk categorize
  const handleBulkCategorize = useCallback(
    (categoryId: string, createRule: boolean, rulePattern?: string) => {
      bulkCategorize(selectedIds, categoryId, createRule, rulePattern);
      setSelectedIds([]); // Clear selection immediately (optimistic)
    },
    [selectedIds, bulkCategorize]
  );

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    bulkDelete(selectedIds);
    setSelectedIds([]); // Clear selection immediately (optimistic)
  }, [selectedIds, bulkDelete]);

  // Handle import
  const handleImport = useCallback(
    (
      txns: ImportTransactionRow[],
      fileName: string,
      fileType: "CSV" | "XLSX"
    ) => {
      setImportData({ transactions: txns, fileName, fileType });
      setShowImportModal(false);
      setShowPreview(true);
    },
    []
  );

  // Handle import complete
  const handleImportComplete = useCallback(() => {
    setShowPreview(false);
    setImportData(null);
    invalidate(); // Refresh transactions after import
  }, [invalidate]);

  // Get sample description for bulk actions
  const sampleDescription =
    selectedIds.length > 0
      ? transactions.find((t) => t.id === selectedIds[0])?.description
      : undefined;

  const hasTransactions = total > 0 || transactionsLoading;

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
                categories={categories}
                categoriesLoading={categoriesLoading}
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
            loading={transactionsLoading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onCategoryChange={handleCategoryChange}
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            categories={categories}
            categoriesLoading={categoriesLoading}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onBulkCategorize={handleBulkCategorize}
            onBulkDelete={handleBulkDelete}
            sampleDescription={sampleDescription}
            categories={categories}
            categoriesLoading={categoriesLoading}
            isDeleting={isBulkDeleting}
            isCategorizing={isBulkCategorizing}
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
