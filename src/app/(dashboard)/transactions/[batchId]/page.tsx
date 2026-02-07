"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, Receipt, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionBatchStatusBadge,
  TransactionBatchSummaryCard,
  TransactionFilters,
  TransactionsTable,
  BulkActions,
  ImportModal,
  ImportPreview,
  AddTransactionModal,
  BatchPLBreakdown,
} from "@/components/transactions";
import {
  useTransactionBatch,
  useTransactions,
  transactionBatchKeys,
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { TransactionFilter, ImportTransactionRow, CreateTransactionInput } from "@/schema/transaction.schema";
import type { ImportMode } from "@/actions/transactions";

export default function TransactionBatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const batchId = params.batchId as string;

  // Filters state
  const [filters, setFilters] = useState<Partial<TransactionFilter>>({
    page: 1,
    limit: 50,
    sortBy: "postingDate",
    sortOrder: "desc",
    transactionBatchId: batchId,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddCsvModal, setShowAddCsvModal] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("APPEND");
  const [showPreview, setShowPreview] = useState(false);
  const [importData, setImportData] = useState<{
    transactions: ImportTransactionRow[];
    fileName: string;
    fileType: "CSV" | "XLSX";
  } | null>(null);

  // Add transaction modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch batch details
  const { batch, isLoading: batchLoading, invalidate: invalidateBatch } = useTransactionBatch(batchId);

  // Fetch transactions for this batch
  const {
    transactions,
    total,
    totalPages,
    categories,
    transactionsLoading,
    categoriesLoading,
    createTransaction,
    updateCategory,
    deleteTransaction,
    bulkDelete,
    bulkCategorize,
    isCreating,
    isBulkDeleting,
    isBulkCategorizing,
    invalidate: invalidateTransactions,
  } = useTransactions({ filters });

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<TransactionFilter>) => {
    setFilters({ ...newFilters, transactionBatchId: batchId });
    setSelectedIds([]);
  }, [batchId]);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({
      ...prev,
      search: search || undefined,
      page: 1,
      transactionBatchId: batchId,
    }));
  }, [batchId]);

  // Handle category change
  const handleCategoryChange = useCallback(
    (transactionId: string, categoryId: string | null) => {
      updateCategory(transactionId, categoryId);
      // Batch financials are recalculated server-side
      setTimeout(() => {
        invalidateBatch();
        queryClient.invalidateQueries({ queryKey: transactionBatchKeys.plStatement(batchId) });
      }, 500);
    },
    [updateCategory, invalidateBatch, queryClient, batchId]
  );

  // Handle delete
  const handleDelete = useCallback(
    (transactionId: string) => {
      deleteTransaction(transactionId);
      setTimeout(() => {
        invalidateBatch();
        queryClient.invalidateQueries({ queryKey: transactionBatchKeys.plStatement(batchId) });
      }, 500);
    },
    [deleteTransaction, invalidateBatch, queryClient, batchId]
  );

  // Handle bulk categorize
  const handleBulkCategorize = useCallback(
    (categoryId: string, createRule: boolean, rulePattern?: string) => {
      bulkCategorize(selectedIds, categoryId, createRule, rulePattern);
      setSelectedIds([]);
      setTimeout(() => {
        invalidateBatch();
        queryClient.invalidateQueries({ queryKey: transactionBatchKeys.plStatement(batchId) });
      }, 500);
    },
    [selectedIds, bulkCategorize, invalidateBatch, queryClient, batchId]
  );

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    bulkDelete(selectedIds);
    setSelectedIds([]);
    setTimeout(() => {
      invalidateBatch();
      queryClient.invalidateQueries({ queryKey: transactionBatchKeys.plStatement(batchId) });
    }, 500);
  }, [selectedIds, bulkDelete, invalidateBatch, queryClient, batchId]);

  // Handle import (REPLACE mode - re-import)
  const handleReimport = useCallback(
    (txns: ImportTransactionRow[], fileName: string, fileType: "CSV" | "XLSX") => {
      setImportData({ transactions: txns, fileName, fileType });
      setImportMode("REPLACE");
      setShowImportModal(false);
      setShowPreview(true);
    },
    []
  );

  // Handle add CSV (APPEND mode)
  const handleAddCsv = useCallback(
    (txns: ImportTransactionRow[], fileName: string, fileType: "CSV" | "XLSX") => {
      setImportData({ transactions: txns, fileName, fileType });
      setImportMode("APPEND");
      setShowAddCsvModal(false);
      setShowPreview(true);
    },
    []
  );

  // Handle import complete
  const handleImportComplete = useCallback(() => {
    setShowPreview(false);
    setImportData(null);
    invalidateTransactions();
    invalidateBatch();
    queryClient.invalidateQueries({ queryKey: transactionBatchKeys.all });
    queryClient.invalidateQueries({ queryKey: transactionBatchKeys.plStatement(batchId) });
  }, [invalidateTransactions, invalidateBatch, queryClient, batchId]);

  // Handle add transaction
  const handleAddTransaction = useCallback(
    async (data: CreateTransactionInput) => {
      try {
        await createTransaction({ ...data, transactionBatchId: batchId });
        setShowAddModal(false);
        invalidateBatch();
        queryClient.invalidateQueries({ queryKey: transactionBatchKeys.plStatement(batchId) });
      } catch {
        // Error is handled by the mutation
      }
    },
    [createTransaction, batchId, invalidateBatch, queryClient]
  );

  // Get sample description for bulk actions
  const sampleDescription =
    selectedIds.length > 0
      ? transactions.find((t) => t.id === selectedIds[0])?.description
      : undefined;

  // Loading state
  if (batchLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Not found state
  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Batch not found
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This transaction batch doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button variant="outline" onClick={() => router.push("/transactions")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
      </div>
    );
  }

  const hasTransactions = total > 0 || transactionsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/transactions")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {batch.name}
              </h1>
              <TransactionBatchStatusBadge status={batch.status} />
            </div>
            {batch.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {batch.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {hasTransactions ? (
            <>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-import
              </Button>
              <Button variant="outline" onClick={() => setShowAddCsvModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Add CSV
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <TransactionBatchSummaryCard batch={batch} />

      {/* P&L Breakdown */}
      {hasTransactions && <BatchPLBreakdown batchId={batchId} />}

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
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Import a bank statement or add transactions manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No transactions in this batch
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Import your bank statement CSV or add transactions manually to populate this batch.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowImportModal(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manually
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Modal (REPLACE when has transactions, APPEND when empty) */}
      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={hasTransactions ? handleReimport : handleAddCsv}
        mode={hasTransactions ? "REPLACE" : "APPEND"}
      />

      {/* Add CSV Modal (APPEND mode) */}
      <ImportModal
        open={showAddCsvModal}
        onOpenChange={setShowAddCsvModal}
        onImport={handleAddCsv}
        mode="APPEND"
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
          transactionBatchId={batchId}
          mode={importMode}
        />
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAddTransaction}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isSubmitting={isCreating}
      />
    </div>
  );
}
