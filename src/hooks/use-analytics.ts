"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsData,
  getYearlySummary,
  getMonthlyBreakdown,
  getQuarterlySummary,
  getAccuracyTrend,
  getTopPerformingBatches,
  getHistoricalComparison,
  getAvailableYears,
} from "@/actions/analytics";

/**
 * Hook to fetch all analytics data for a given year
 */
export function useAnalyticsData(year: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", year],
    queryFn: () => getAnalyticsData(year),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    data: data?.success ? data.data : null,
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch yearly summary
 */
export function useYearlySummary(year: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "yearlySummary", year],
    queryFn: () => getYearlySummary(year),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.success ? data.data : null,
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch monthly breakdown
 */
export function useMonthlyBreakdown(year: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "monthlyBreakdown", year],
    queryFn: () => getMonthlyBreakdown(year),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.success ? data.data : [],
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch quarterly summary
 */
export function useQuarterlySummary(year: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "quarterlySummary", year],
    queryFn: () => getQuarterlySummary(year),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.success ? data.data : [],
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch accuracy trend
 */
export function useAccuracyTrend(lastNWeeks: number = 12) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "accuracyTrend", lastNWeeks],
    queryFn: () => getAccuracyTrend(lastNWeeks),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.success ? data.data : [],
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch top performing batches
 */
export function useTopPerformingBatches(year: number, limit: number = 5) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "topPerformingBatches", year, limit],
    queryFn: () => getTopPerformingBatches(year, limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.success ? data.data : [],
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch historical comparison (year-over-year)
 */
export function useHistoricalComparison(
  currentYear: number,
  options?: {
    month?: number;
    quarter?: number;
  }
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "analytics",
      "historicalComparison",
      currentYear,
      options?.month,
      options?.quarter,
    ],
    queryFn: () =>
      getHistoricalComparison(
        currentYear,
        options?.month,
        options?.quarter
      ),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.success ? data.data : null,
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}

/**
 * Hook to fetch available years with data
 */
export function useAvailableYears() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "availableYears"],
    queryFn: () => getAvailableYears(),
    staleTime: 10 * 60 * 1000, // Cache for longer since years don't change often
  });

  return {
    years: data?.success ? data.data : [new Date().getFullYear()],
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    refetch,
  };
}
