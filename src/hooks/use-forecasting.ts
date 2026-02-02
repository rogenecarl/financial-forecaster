"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAmazonInvoices,
  getAmazonInvoice,
  deleteAmazonInvoice,
  getInvoiceStats,
  getInvoiceMatchingStats,
  type InvoiceSummary,
} from "@/actions/forecasting";
import {
  getTripsWithStats,
  getTripsWithLoads,
  getTripDateRange,
  bulkDeleteTrips,
  type TripWithLoadsForTable,
  type TripsFilterParams,
} from "@/actions/forecasting/trips";
import {
  getForecasts,
  deleteForecast,
} from "@/actions/forecasting/forecasts";
import {
  getAggregatedVariance,
  getForecastDateRange,
} from "@/actions/forecasting/forecast-weeks";
import type { Forecast } from "@/schema/forecasting.schema";
import { toast } from "sonner";

// ============================================
// QUERY KEYS
// ============================================

export const forecastingKeys = {
  // Amazon Invoices
  invoices: ["invoices"] as const,
  invoicesList: () => [...forecastingKeys.invoices, "list"] as const,
  invoiceStats: () => [...forecastingKeys.invoices, "stats"] as const,
  invoiceDetail: (id: string) => [...forecastingKeys.invoices, "detail", id] as const,
  invoiceMatchingStats: (id?: string) => [...forecastingKeys.invoices, "matchingStats", id] as const,

  // Trips
  trips: ["trips"] as const,
  tripsList: (params?: TripsFilterParams) =>
    [
      ...forecastingKeys.trips,
      "list",
      params?.startDate?.toISOString(),
      params?.endDate?.toISOString(),
      params?.weekId,
      params?.importBatchId,
      params?.tripStage,
    ] as const,
  tripDateRange: () => [...forecastingKeys.trips, "dateRange"] as const,

  // Forecasts (scenarios)
  forecasts: ["forecasts"] as const,
  forecastsList: () => [...forecastingKeys.forecasts, "list"] as const,

  // Forecast vs Actual
  variance: ["variance"] as const,
  varianceData: (startDate?: Date, endDate?: Date) =>
    [...forecastingKeys.variance, "data", startDate?.toISOString(), endDate?.toISOString()] as const,
  varianceDateRange: () => [...forecastingKeys.variance, "dateRange"] as const,
};

// ============================================
// AMAZON INVOICES HOOKS
// ============================================

export function useAmazonInvoices() {
  const queryClient = useQueryClient();

  // Fetch invoices list
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
  } = useQuery({
    queryKey: forecastingKeys.invoicesList(),
    queryFn: async () => {
      const result = await getAmazonInvoices();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch invoice stats
  const {
    data: stats = { totalInvoices: 0, totalTourPay: 0, totalAccessorials: 0, totalPay: 0 },
    isLoading: statsLoading,
  } = useQuery({
    queryKey: forecastingKeys.invoiceStats(),
    queryFn: async () => {
      const result = await getInvoiceStats();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const result = await deleteAmazonInvoice(invoiceId);
      if (!result.success) throw new Error(result.error);
      return invoiceId;
    },
    onMutate: async (invoiceId) => {
      await queryClient.cancelQueries({ queryKey: forecastingKeys.invoicesList() });

      const previousInvoices = queryClient.getQueryData<InvoiceSummary[]>(
        forecastingKeys.invoicesList()
      );

      // Optimistically remove
      queryClient.setQueryData<InvoiceSummary[]>(
        forecastingKeys.invoicesList(),
        (old) => old?.filter((inv) => inv.id !== invoiceId) ?? []
      );

      return { previousInvoices };
    },
    onError: (err, _, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(forecastingKeys.invoicesList(), context.previousInvoices);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete invoice");
    },
    onSuccess: () => {
      toast.success("Invoice deleted");
      // Invalidate stats to refresh totals
      queryClient.invalidateQueries({ queryKey: forecastingKeys.invoiceStats() });
    },
  });

  // Invalidate all invoice data
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: forecastingKeys.invoices });
  };

  return {
    invoices,
    stats,
    isLoading: invoicesLoading || statsLoading,
    deleteInvoice: (id: string) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
    invalidate,
  };
}

export function useAmazonInvoiceDetail(invoiceId: string | null) {
  const {
    data: invoice,
    isLoading,
  } = useQuery({
    queryKey: forecastingKeys.invoiceDetail(invoiceId ?? ""),
    queryFn: async () => {
      if (!invoiceId) return null;
      const result = await getAmazonInvoice(invoiceId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!invoiceId,
    staleTime: 60 * 1000,
  });

  return { invoice: invoice ?? null, isLoading };
}

// ============================================
// TRIPS HOOKS
// ============================================

export function useTripDateRange() {
  const { data: dateRange, isLoading } = useQuery({
    queryKey: forecastingKeys.tripDateRange(),
    queryFn: async () => {
      const result = await getTripDateRange();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000,
  });

  return { dateRange: dateRange ?? null, isLoading };
}

export function useTrips(startDate?: Date, endDate?: Date) {
  const queryClient = useQueryClient();
  const params: TripsFilterParams = { startDate, endDate };

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: forecastingKeys.tripsList(params),
    queryFn: async () => {
      const result = await getTripsWithStats(startDate, endDate);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
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
    invalidate,
  };
}

export function useTripsWithLoads(params?: TripsFilterParams) {
  const queryClient = useQueryClient();

  const queryKey = [...forecastingKeys.tripsList(params), "withLoads"];

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getTripsWithLoads(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Bulk delete mutation with optimistic update
  const bulkDeleteMutation = useMutation({
    mutationFn: async (tripIds: string[]) => {
      const result = await bulkDeleteTrips(tripIds);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async (tripIds) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<{
        trips: TripWithLoadsForTable[];
        stats: { totalTrips: number; projectedLoads: number; actualLoads: number; updatedCount: number; completion: number };
      }>(queryKey);

      // Optimistically remove the trips
      const idsSet = new Set(tripIds);
      queryClient.setQueryData(queryKey, (old: typeof previousData) => {
        if (!old) return old;
        const remainingTrips = old.trips.filter((t) => !idsSet.has(t.id));
        return {
          ...old,
          trips: remainingTrips,
          stats: {
            ...old.stats,
            totalTrips: remainingTrips.length,
            projectedLoads: remainingTrips.reduce((sum, t) => sum + t.projectedLoads, 0),
            actualLoads: remainingTrips.reduce((sum, t) => sum + (t.actualLoads || 0), 0),
            updatedCount: remainingTrips.filter((t) => t.actualLoads !== null).length,
            completion: remainingTrips.length > 0
              ? Math.round((remainingTrips.filter((t) => t.actualLoads !== null).length / remainingTrips.length) * 100)
              : 0,
          },
        };
      });

      return { previousData, count: tripIds.length };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete trips");
    },
    onSuccess: (data, _, context) => {
      toast.success(`Deleted ${context?.count || data.deletedCount} trips`);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: forecastingKeys.variance });
    },
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
    invalidate,
    bulkDelete: (ids: string[]) => bulkDeleteMutation.mutate(ids),
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
}

// ============================================
// FORECASTS (SCENARIOS) HOOKS
// ============================================

export function useForecasts() {
  const queryClient = useQueryClient();

  const {
    data: forecasts = [],
    isLoading,
  } = useQuery({
    queryKey: forecastingKeys.forecastsList(),
    queryFn: async () => {
      const result = await getForecasts();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (forecastId: string) => {
      const result = await deleteForecast(forecastId);
      if (!result.success) throw new Error(result.error);
      return forecastId;
    },
    onMutate: async (forecastId) => {
      await queryClient.cancelQueries({ queryKey: forecastingKeys.forecastsList() });

      const previousForecasts = queryClient.getQueryData<Forecast[]>(
        forecastingKeys.forecastsList()
      );

      queryClient.setQueryData<Forecast[]>(
        forecastingKeys.forecastsList(),
        (old) => old?.filter((f) => f.id !== forecastId) ?? []
      );

      return { previousForecasts };
    },
    onError: (err, _, context) => {
      if (context?.previousForecasts) {
        queryClient.setQueryData(forecastingKeys.forecastsList(), context.previousForecasts);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete scenario");
    },
    onSuccess: () => {
      toast.success("Scenario deleted");
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: forecastingKeys.forecasts });
  };

  return {
    forecasts,
    isLoading,
    deleteForecast: (id: string) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
    invalidate,
  };
}

// ============================================
// FORECAST VS ACTUAL HOOKS
// ============================================

export function useForecastDateRange() {
  const { data: dateRange, isLoading } = useQuery({
    queryKey: forecastingKeys.varianceDateRange(),
    queryFn: async () => {
      const result = await getForecastDateRange();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000,
  });

  return { dateRange: dateRange ?? null, isLoading };
}

export function useForecastVariance(startDate?: Date, endDate?: Date) {
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: forecastingKeys.varianceData(startDate, endDate),
    queryFn: async () => {
      const result = await getAggregatedVariance(startDate, endDate);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
  };
}

// ============================================
// INVOICE MATCHING STATS HOOK
// ============================================

export function useInvoiceMatchingStats(invoiceId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: forecastingKeys.invoiceMatchingStats(invoiceId),
    queryFn: async () => {
      const result = await getInvoiceMatchingStats(invoiceId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  return {
    matchingStats: data ?? null,
    isLoading,
  };
}

// ============================================
// FILTER HOOKS
// ============================================

import {
  getWeekOptions,
  getImportBatchOptions,
  getTripStatusCounts,
} from "@/actions/filters";

export const filterKeys = {
  weeks: ["filters", "weeks"] as const,
  weekOptions: () => [...filterKeys.weeks, "options"] as const,
  importBatches: ["filters", "importBatches"] as const,
  importBatchOptions: () => [...filterKeys.importBatches, "options"] as const,
  statusCounts: (weekId?: string, importBatchId?: string) =>
    ["filters", "statusCounts", weekId, importBatchId] as const,
};

export function useWeekOptions() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: filterKeys.weekOptions(),
    queryFn: async () => {
      const result = await getWeekOptions();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - weeks don't change often
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: filterKeys.weeks });
  };

  return {
    weeks: data ?? [],
    isLoading,
    invalidate,
  };
}

export function useImportBatchOptions() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: filterKeys.importBatchOptions(),
    queryFn: async () => {
      const result = await getImportBatchOptions();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute - changes on import
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: filterKeys.importBatches });
  };

  return {
    batches: data ?? [],
    isLoading,
    invalidate,
  };
}

export function useTripStatusCounts(weekId?: string, importBatchId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: filterKeys.statusCounts(weekId ?? undefined, importBatchId ?? undefined),
    queryFn: async () => {
      const result = await getTripStatusCounts(
        weekId ?? undefined,
        importBatchId ?? undefined
      );
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  return {
    statusCounts: data ?? [],
    isLoading,
  };
}
