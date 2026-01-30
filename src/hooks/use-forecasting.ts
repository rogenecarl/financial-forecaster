"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAmazonInvoices,
  getAmazonInvoice,
  deleteAmazonInvoice,
  getInvoiceStats,
  type InvoiceSummary,
} from "@/actions/forecasting";
import {
  getTripsWithStats,
  getTripDateRange,
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

  // Trips
  trips: ["trips"] as const,
  tripsList: (startDate?: Date, endDate?: Date) =>
    [...forecastingKeys.trips, "list", startDate?.toISOString(), endDate?.toISOString()] as const,
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

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: forecastingKeys.tripsList(startDate, endDate),
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
