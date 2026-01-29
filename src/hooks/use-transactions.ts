"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  bulkUpdateCategory,
  type TransactionListResult,
} from "@/actions/transactions";
import { getCategories } from "@/actions/settings/categories";
import type { TransactionFilter } from "@/schema/transaction.schema";
import type { Category } from "@/lib/generated/prisma/client";
import { toast } from "sonner";

// Query keys
export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: Partial<TransactionFilter>) => ["transactions", "list", filters] as const,
  categories: ["categories"] as const,
};

interface UseTransactionsOptions {
  filters: Partial<TransactionFilter>;
}

export function useTransactions({ filters }: UseTransactionsOptions) {
  const queryClient = useQueryClient();

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch,
  } = useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const result = await getTransactions(filters);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch transactions");
      }
      return result.data;
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: transactionKeys.categories,
    queryFn: async () => {
      const result = await getCategories();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch categories");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // Categories don't change often
  });

  // Helper to find category by ID
  const findCategory = (categoryId: string | null): Category | null => {
    if (!categoryId) return null;
    return categories?.find((c) => c.id === categoryId) || null;
  };

  // Update single transaction category (optimistic)
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      transactionId,
      categoryId,
    }: {
      transactionId: string;
      categoryId: string | null;
    }) => {
      const result = await updateTransaction({ id: transactionId, categoryId });
      if (!result.success) {
        throw new Error(result.error || "Failed to update category");
      }
      return result.data;
    },
    onMutate: async ({ transactionId, categoryId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionKeys.list(filters) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TransactionListResult>(
        transactionKeys.list(filters)
      );

      // Optimistically update
      queryClient.setQueryData<TransactionListResult>(
        transactionKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            transactions: old.transactions.map((t) =>
              t.id === transactionId
                ? {
                    ...t,
                    categoryId,
                    category: findCategory(categoryId),
                    manualOverride: true,
                    reviewStatus: "REVIEWED" as const,
                  }
                : t
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(transactionKeys.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    },
    onSuccess: () => {
      toast.success("Category updated");
    },
  });

  // Delete single transaction (optimistic)
  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const result = await deleteTransaction(transactionId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete transaction");
      }
      return result.data;
    },
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.list(filters) });

      const previousData = queryClient.getQueryData<TransactionListResult>(
        transactionKeys.list(filters)
      );

      // Optimistically remove
      queryClient.setQueryData<TransactionListResult>(
        transactionKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            transactions: old.transactions.filter((t) => t.id !== transactionId),
            total: old.total - 1,
          };
        }
      );

      return { previousData };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(transactionKeys.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete transaction");
    },
    onSuccess: () => {
      toast.success("Transaction deleted");
    },
  });

  // Bulk delete transactions (optimistic)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const result = await bulkDeleteTransactions(transactionIds);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete transactions");
      }
      return result.data;
    },
    onMutate: async (transactionIds) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.list(filters) });

      const previousData = queryClient.getQueryData<TransactionListResult>(
        transactionKeys.list(filters)
      );

      // Optimistically remove all selected
      const idsSet = new Set(transactionIds);
      queryClient.setQueryData<TransactionListResult>(
        transactionKeys.list(filters),
        (old) => {
          if (!old) return old;
          const remaining = old.transactions.filter((t) => !idsSet.has(t.id));
          return {
            ...old,
            transactions: remaining,
            total: old.total - transactionIds.length,
          };
        }
      );

      return { previousData, count: transactionIds.length };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(transactionKeys.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete transactions");
    },
    onSuccess: (data, _, context) => {
      toast.success(`Deleted ${context?.count || data.deletedCount} transactions`);
    },
  });

  // Bulk update category (optimistic)
  const bulkCategorizeMutation = useMutation({
    mutationFn: async ({
      transactionIds,
      categoryId,
      createRule,
      rulePattern,
    }: {
      transactionIds: string[];
      categoryId: string;
      createRule: boolean;
      rulePattern?: string;
    }) => {
      const result = await bulkUpdateCategory({
        transactionIds,
        categoryId,
        createRule,
        rulePattern,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to update transactions");
      }
      return result.data;
    },
    onMutate: async ({ transactionIds, categoryId }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.list(filters) });

      const previousData = queryClient.getQueryData<TransactionListResult>(
        transactionKeys.list(filters)
      );

      const category = findCategory(categoryId);
      const idsSet = new Set(transactionIds);

      // Optimistically update all selected
      queryClient.setQueryData<TransactionListResult>(
        transactionKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            transactions: old.transactions.map((t) =>
              idsSet.has(t.id)
                ? {
                    ...t,
                    categoryId,
                    category,
                    manualOverride: true,
                    reviewStatus: "REVIEWED" as const,
                  }
                : t
            ),
          };
        }
      );

      return { previousData, count: transactionIds.length };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(transactionKeys.list(filters), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update transactions");
    },
    onSuccess: (data, _, context) => {
      toast.success(`Updated ${context?.count || data?.updatedCount} transactions`);
    },
  });

  // Invalidate to refetch (for import complete, etc.)
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  };

  return {
    // Data
    transactions: transactionsData?.transactions ?? [],
    total: transactionsData?.total ?? 0,
    totalPages: transactionsData?.totalPages ?? 0,
    categories: categories ?? [],

    // Loading states
    transactionsLoading,
    categoriesLoading,

    // Actions
    updateCategory: (transactionId: string, categoryId: string | null) =>
      updateCategoryMutation.mutate({ transactionId, categoryId }),
    deleteTransaction: (transactionId: string) => deleteMutation.mutate(transactionId),
    bulkDelete: (transactionIds: string[]) => bulkDeleteMutation.mutate(transactionIds),
    bulkCategorize: (
      transactionIds: string[],
      categoryId: string,
      createRule: boolean,
      rulePattern?: string
    ) => bulkCategorizeMutation.mutate({ transactionIds, categoryId, createRule, rulePattern }),

    // Mutation states
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkCategorizing: bulkCategorizeMutation.isPending,

    // Utilities
    refetch,
    invalidate,
  };
}
