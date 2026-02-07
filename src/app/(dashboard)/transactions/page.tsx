"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Receipt, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TransactionBatchCard,
  TransactionBatchCardSkeleton,
  TransactionBatchCreateModal,
  TransactionBatchDeleteDialog,
} from "@/components/transactions";
import type { TransactionBatchSummary, TransactionBatchFilters } from "@/actions/transactions/transaction-batches";
import type { TransactionBatchStatus } from "@/lib/generated/prisma/client";
import { useTransactionBatches } from "@/hooks";

const STATUS_OPTIONS: { value: TransactionBatchStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "EMPTY", label: "Empty" },
  { value: "ACTIVE", label: "Active" },
  { value: "RECONCILED", label: "Reconciled" },
];

export default function TransactionBatchesPage() {
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionBatchStatus | "all">("all");

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editBatch, setEditBatch] = useState<TransactionBatchSummary | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<TransactionBatchSummary | null>(null);

  // Build filter params
  const filters: TransactionBatchFilters = {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  // Fetch batches
  const { batches, isLoading } = useTransactionBatches(filters);

  // Handlers
  const handleBatchClick = useCallback(
    (batch: TransactionBatchSummary) => {
      router.push(`/transactions/${batch.id}`);
    },
    [router]
  );

  const handleCreateSuccess = useCallback(() => {
    setEditBatch(null);
    setShowCreate(false);
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreate(false);
    setEditBatch(null);
  }, []);

  // Stats summary
  const totalTransactions = batches.reduce((sum, b) => sum + b.transactionCount, 0);
  const totalNetRevenue = batches.reduce((sum, b) => sum + b.netRevenue, 0);
  const reconciledCount = batches.filter((b) => b.status === "RECONCILED").length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Organize bank statements into batches for easier tracking and categorization
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Batch
        </Button>
      </div>

      {/* Summary Stats */}
      {batches.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Batches</div>
            <div className="text-2xl font-bold">{batches.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Transactions</div>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Net Revenue</div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(totalNetRevenue)}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Reconciled</div>
            <div className="text-2xl font-bold text-purple-700">
              {reconciledCount} / {batches.length}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TransactionBatchStatus | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter indicator */}
      {(search || statusFilter !== "all") && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtering:</span>
          {search && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
              &quot;{search}&quot;
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
              {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Batch Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <TransactionBatchCardSkeleton key={i} />
          ))}
        </div>
      ) : batches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <TransactionBatchCard
              key={batch.id}
              batch={batch}
              onClick={() => handleBatchClick(batch)}
              onEdit={() => {
                setEditBatch(batch);
                setShowCreate(true);
              }}
              onDelete={() => setDeletingBatch(batch)}
            />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {search || statusFilter !== "all"
              ? "No batches match your filters"
              : "No transaction batches yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Create your first batch to start organizing your bank statements and tracking financials."}
          </p>
          {search || statusFilter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Batch
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TransactionBatchCreateModal
        open={showCreate}
        onOpenChange={closeCreateModal}
        onSuccess={handleCreateSuccess}
        editBatch={editBatch}
      />

      {/* Delete Dialog */}
      <TransactionBatchDeleteDialog
        open={!!deletingBatch}
        onOpenChange={(open) => !open && setDeletingBatch(null)}
        batch={deletingBatch}
        onSuccess={() => setDeletingBatch(null)}
      />
    </div>
  );
}
