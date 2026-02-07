"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactionBatches,
  getTransactionBatch,
  createTransactionBatch,
  updateTransactionBatch,
  deleteTransactionBatch,
  type TransactionBatchSummary,
  type TransactionBatchFilters,
  type CreateTransactionBatchInput,
  type UpdateTransactionBatchInput,
} from "@/actions/transactions/transaction-batches";
import { getBatchPLStatement } from "@/actions/transactions/pl-statement";
import { transactionKeys } from "./use-transactions";
import { toast } from "sonner";

// ============================================
// QUERY KEYS
// ============================================

export const transactionBatchKeys = {
  all: ["transactionBatches"] as const,
  list: (filters?: TransactionBatchFilters) =>
    [...transactionBatchKeys.all, "list", filters] as const,
  detail: (id: string) =>
    [...transactionBatchKeys.all, "detail", id] as const,
  plStatement: (id: string) =>
    [...transactionBatchKeys.all, "plStatement", id] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

export function useTransactionBatches(filters?: TransactionBatchFilters) {
  const queryClient = useQueryClient();

  const {
    data: batches = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: transactionBatchKeys.list(filters),
    queryFn: async () => {
      const result = await getTransactionBatches(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: transactionBatchKeys.all });
  };

  return {
    batches,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    invalidate,
  };
}

export function useTransactionBatch(batchId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: batch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: transactionBatchKeys.detail(batchId ?? ""),
    queryFn: async () => {
      if (!batchId) return null;
      const result = await getTransactionBatch(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!batchId,
    staleTime: 30 * 1000,
  });

  const invalidate = () => {
    if (batchId) {
      queryClient.invalidateQueries({
        queryKey: transactionBatchKeys.detail(batchId),
      });
    }
  };

  return {
    batch: batch ?? null,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    invalidate,
  };
}

export function useBatchPLStatement(batchId: string) {
  const {
    data: statement,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: transactionBatchKeys.plStatement(batchId),
    queryFn: async () => {
      const result = await getBatchPLStatement(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!batchId,
    staleTime: 30 * 1000,
  });

  return {
    statement: statement ?? null,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateTransactionBatch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateTransactionBatchInput) => {
      const result = await createTransactionBatch(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionBatchKeys.all });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    },
  });

  return {
    createBatch: mutation.mutate,
    createBatchAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

export function useUpdateTransactionBatch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateTransactionBatchInput) => {
      const result = await updateTransactionBatch(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: transactionBatchKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: transactionBatchKeys.all });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update batch");
    },
  });

  return {
    updateBatch: mutation.mutate,
    updateBatchAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

export function useDeleteTransactionBatch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (batchId: string) => {
      const result = await deleteTransactionBatch(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async (batchId) => {
      await queryClient.cancelQueries({ queryKey: transactionBatchKeys.list() });

      const previousBatches = queryClient.getQueriesData<TransactionBatchSummary[]>({
        queryKey: transactionBatchKeys.list(),
      });

      queryClient.setQueriesData<TransactionBatchSummary[]>(
        { queryKey: transactionBatchKeys.list() },
        (old) => old?.filter((b) => b.id !== batchId) ?? []
      );

      return { previousBatches };
    },
    onError: (err, _, context) => {
      if (context?.previousBatches) {
        for (const [queryKey, data] of context.previousBatches) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete batch");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionBatchKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });

  return {
    deleteBatch: mutation.mutate,
    deleteBatchAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

// ============================================
// RE-EXPORT TYPES
// ============================================

export type {
  TransactionBatchSummary,
  TransactionBatchFilters,
  CreateTransactionBatchInput,
  UpdateTransactionBatchInput,
};
