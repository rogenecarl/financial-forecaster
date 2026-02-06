"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTripBatches,
  getTripBatch,
  createTripBatch,
  updateTripBatch,
  deleteTripBatch,
  importTripsToBatch,
  checkDuplicateTripFile,
  recalculateBatchMetrics,
  type TripBatchSummary,
  type TripBatchDetail,
  type TripBatchFilters,
  type CreateTripBatchInput,
  type UpdateTripBatchInput,
  type TripImportResult,
  type DuplicateFileCheckResult,
} from "@/actions/forecasting/trip-batches";
import {
  importInvoiceToBatch,
  checkDuplicateInvoiceFile,
  type InvoiceImportResult,
  type DuplicateInvoiceFileCheckResult,
} from "@/actions/forecasting/amazon-invoices";
import {
  getTripsWithLoads,
  type TripsFilterParams,
  type TripWithLoadsForTable,
} from "@/actions/forecasting/trips";
import { forecastingKeys } from "./use-forecasting";
import { toast } from "sonner";
import type { ImportTrip, ImportInvoice } from "@/schema/forecasting.schema";

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook to fetch list of trip batches with optional filters
 */
export function useTripBatches(filters?: TripBatchFilters) {
  const queryClient = useQueryClient();

  const {
    data: batches = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...forecastingKeys.tripBatchesList(), filters],
    queryFn: async () => {
      const result = await getTripBatches(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
  };

  return {
    batches,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    invalidate,
  };
}

/**
 * Hook to fetch a single trip batch by ID
 */
export function useTripBatch(batchId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: batch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: forecastingKeys.tripBatchDetail(batchId ?? ""),
    queryFn: async () => {
      if (!batchId) return null;
      const result = await getTripBatch(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!batchId,
    staleTime: 30 * 1000,
  });

  const invalidate = () => {
    if (batchId) {
      queryClient.invalidateQueries({
        queryKey: forecastingKeys.tripBatchDetail(batchId),
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

/**
 * Hook to fetch trips for a specific batch
 */
export function useTripBatchTrips(
  batchId: string | null,
  tripStage?: string
) {
  const queryClient = useQueryClient();

  const params: TripsFilterParams | undefined = batchId
    ? { batchId, tripStage: tripStage as TripsFilterParams["tripStage"] }
    : undefined;

  const queryKey = [...forecastingKeys.tripsList(params), "withLoads"];

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!batchId) return null;
      const result = await getTripsWithLoads(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!batchId,
    staleTime: 30 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: forecastingKeys.trips });
  };

  return {
    trips: data?.trips ?? [],
    stats: data?.stats ?? {
      totalTrips: 0,
      projectedLoads: 0,
      actualLoads: 0,
      updatedCount: 0,
      completion: 0,
    },
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    invalidate,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook to create a new trip batch
 */
export function useCreateTripBatch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateTripBatchInput) => {
      const result = await createTripBatch(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
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

/**
 * Hook to update an existing trip batch
 */
export function useUpdateTripBatch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateTripBatchInput) => {
      const result = await updateTripBatch(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate both the specific batch and the list
      queryClient.invalidateQueries({
        queryKey: forecastingKeys.tripBatchDetail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
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

/**
 * Hook to delete a trip batch with optimistic UI
 */
export function useDeleteTripBatch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (batchId: string) => {
      const result = await deleteTripBatch(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async (batchId) => {
      // Cancel in-flight list queries
      await queryClient.cancelQueries({ queryKey: forecastingKeys.tripBatchesList() });

      // Snapshot for rollback
      const previousBatches = queryClient.getQueriesData<TripBatchSummary[]>({
        queryKey: forecastingKeys.tripBatchesList(),
      });

      // Optimistically remove the batch from all list queries
      queryClient.setQueriesData<TripBatchSummary[]>(
        { queryKey: forecastingKeys.tripBatchesList() },
        (old) => old?.filter((b) => b.id !== batchId) ?? []
      );

      return { previousBatches };
    },
    onError: (err, _, context) => {
      // Roll back optimistic update
      if (context?.previousBatches) {
        for (const [queryKey, data] of context.previousBatches) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete batch");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.trips });
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

/**
 * Hook to import trips to a batch
 */
export function useImportTripsToBatch() {
  const queryClient = useQueryClient();

  // Check for duplicate file
  const checkDuplicate = useMutation({
    mutationFn: async ({
      batchId,
      fileHash,
    }: {
      batchId: string;
      fileHash: string;
    }) => {
      const result = await checkDuplicateTripFile(batchId, fileHash);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Import trips
  const importMutation = useMutation({
    mutationFn: async ({
      batchId,
      trips,
      fileHash,
    }: {
      batchId: string;
      trips: ImportTrip[];
      fileHash?: string;
    }) => {
      const result = await importTripsToBatch(batchId, trips, fileHash);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      let message = `Imported ${data.imported} trips`;
      if (data.replaced > 0) {
        message = `Replaced ${data.replaced} trips with ${data.imported} new trips`;
      }
      if (data.skipped > 0) {
        message += ` (${data.skipped} skipped - exist in other batches)`;
      }
      toast.success(message);

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: forecastingKeys.tripBatchDetail(data.batchId),
      });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.trips });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to import trips";
      // Don't show toast for duplicate file errors (handled by component)
      if (!message.startsWith("DUPLICATE_FILE:")) {
        toast.error(message);
      }
    },
  });

  return {
    // Duplicate check
    checkDuplicate: checkDuplicate.mutateAsync,
    isCheckingDuplicate: checkDuplicate.isPending,

    // Import
    importTrips: importMutation.mutate,
    importTripsAsync: importMutation.mutateAsync,
    isPending: importMutation.isPending,
    isSuccess: importMutation.isSuccess,
    isError: importMutation.isError,
    error: importMutation.error instanceof Error ? importMutation.error.message : null,
    data: importMutation.data,
    reset: importMutation.reset,
  };
}

/**
 * Hook to import invoice to a batch
 */
export function useImportInvoiceToBatch() {
  const queryClient = useQueryClient();

  // Check for duplicate file
  const checkDuplicate = useMutation({
    mutationFn: async ({
      batchId,
      fileHash,
    }: {
      batchId: string;
      fileHash: string;
    }) => {
      const result = await checkDuplicateInvoiceFile(batchId, fileHash);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Import invoice
  const importMutation = useMutation({
    mutationFn: async ({
      batchId,
      data,
      fileHash,
    }: {
      batchId: string;
      data: ImportInvoice;
      fileHash?: string;
    }) => {
      const result = await importInvoiceToBatch(batchId, data, fileHash);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Invoice imported: ${data.matchedTrips} trips matched from ${data.lineItemCount} line items`
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: forecastingKeys.tripBatchDetail(data.batchId),
      });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.trips });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.invoices });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to import invoice";
      // Don't show toast for duplicate file errors (handled by component)
      if (!message.startsWith("DUPLICATE_FILE:")) {
        toast.error(message);
      }
    },
  });

  return {
    // Duplicate check
    checkDuplicate: checkDuplicate.mutateAsync,
    isCheckingDuplicate: checkDuplicate.isPending,

    // Import
    importInvoice: importMutation.mutate,
    importInvoiceAsync: importMutation.mutateAsync,
    isPending: importMutation.isPending,
    isSuccess: importMutation.isSuccess,
    isError: importMutation.isError,
    error: importMutation.error instanceof Error ? importMutation.error.message : null,
    data: importMutation.data,
    reset: importMutation.reset,
  };
}

/**
 * Hook to recalculate batch metrics
 */
export function useRecalculateBatchMetrics() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (batchId: string) => {
      const result = await recalculateBatchMetrics(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: forecastingKeys.tripBatchDetail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to recalculate metrics"
      );
    },
  });

  return {
    recalculate: mutation.mutate,
    recalculateAsync: mutation.mutateAsync,
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
  TripBatchSummary,
  TripBatchDetail,
  TripBatchFilters,
  CreateTripBatchInput,
  UpdateTripBatchInput,
  TripImportResult,
  DuplicateFileCheckResult,
  InvoiceImportResult,
  DuplicateInvoiceFileCheckResult,
  TripWithLoadsForTable,
};
