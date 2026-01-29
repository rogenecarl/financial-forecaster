"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CategorySelect } from "./category-select";
import { cn } from "@/lib/utils";
import type { TransactionWithCategory } from "@/actions/transactions";
import type { TransactionFilter } from "@/schema/transaction.schema";
import type { Category } from "@/lib/generated/prisma/client";

// SortButton component moved outside to avoid recreation during render
interface SortButtonProps {
  column: TransactionFilter["sortBy"];
  children: React.ReactNode;
  onSort: (column: TransactionFilter["sortBy"]) => void;
}

function SortButton({ column, children, onSort }: SortButtonProps) {
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-slate-900"
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );
}

interface TransactionsTableProps {
  transactions: TransactionWithCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading?: boolean;
  filters: Partial<TransactionFilter>;
  onFiltersChange: (filters: Partial<TransactionFilter>) => void;
  onCategoryChange: (transactionId: string, categoryId: string | null) => void;
  onDelete: (transactionId: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  categories: Category[];
  categoriesLoading?: boolean;
}

export function TransactionsTable({
  transactions,
  total,
  page,
  limit,
  totalPages,
  loading,
  filters,
  onFiltersChange,
  onCategoryChange,
  onDelete,
  selectedIds,
  onSelectionChange,
  categories,
  categoriesLoading = false,
}: TransactionsTableProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(absAmount);

    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const handleSort = (column: TransactionFilter["sortBy"]) => {
    const newOrder =
      filters.sortBy === column && filters.sortOrder === "desc" ? "asc" : "desc";
    onFiltersChange({
      ...filters,
      sortBy: column,
      sortOrder: newOrder,
    });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({
      ...filters,
      page: newPage,
    });
  };

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === transactions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(transactions.map((t) => t.id));
    }
  }, [selectedIds, transactions, onSelectionChange]);

  const handleSelect = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((i) => i !== id));
      }
    },
    [selectedIds, onSelectionChange]
  );

  const getStatusIcon = (status: string, aiCategorized: boolean) => {
    if (status === "REVIEWED") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === "FLAGGED" || (aiCategorized && status === "PENDING")) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    return <Clock className="h-4 w-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px]">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-slate-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px]">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50">
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        transactions.length > 0 &&
                        selectedIds.length === transactions.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <SortButton column="postingDate" onSort={handleSort}>Date</SortButton>
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <SortButton column="description" onSort={handleSort}>Description</SortButton>
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    <SortButton column="amount" onSort={handleSort}>Amount</SortButton>
                  </TableHead>
                  <TableHead className="w-[180px]">Category</TableHead>
                  <TableHead className="w-[60px]">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className={cn(
                      "hover:bg-slate-50",
                      selectedIds.includes(transaction.id) && "bg-blue-50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)}
                        onCheckedChange={(checked) =>
                          handleSelect(transaction.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(transaction.postingDate)}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[200px] max-w-[400px]">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {transaction.type} • {transaction.details}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-sm font-medium whitespace-nowrap",
                        Number(transaction.amount) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {formatAmount(Number(transaction.amount))}
                    </TableCell>
                    <TableCell>
                      {editingCategoryId === transaction.id ? (
                        <CategorySelect
                          value={transaction.categoryId}
                          onValueChange={(categoryId) => {
                            onCategoryChange(transaction.id, categoryId);
                            setEditingCategoryId(null);
                          }}
                          categories={categories}
                          loading={categoriesLoading}
                          className="w-full"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingCategoryId(transaction.id)}
                          className="flex items-center gap-2 text-sm hover:bg-slate-100 rounded px-2 py-1 -mx-2 transition-colors w-full"
                        >
                          {transaction.category ? (
                            <>
                              <Circle
                                className="h-3 w-3 flex-shrink-0"
                                style={{
                                  fill: transaction.category.color,
                                  color: transaction.category.color,
                                }}
                              />
                              <span className="truncate">
                                {transaction.category.name}
                              </span>
                              {transaction.aiCategorized &&
                                !transaction.manualOverride && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-1"
                                  >
                                    AI
                                  </Badge>
                                )}
                            </>
                          ) : (
                            <span className="text-slate-400">Uncategorized</span>
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getStatusIcon(
                          transaction.reviewStatus,
                          transaction.aiCategorized
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingCategoryId(transaction.id)}
                          >
                            Change Category
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(transaction.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <p className="text-slate-500 text-center sm:text-left">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
          {total} transactions
        </p>
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
