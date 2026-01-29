"use client";

import { useQuery } from "@tanstack/react-query";
import { getPLStatement, getTransactionDateRange } from "@/actions/transactions";

// Query keys
export const plStatementKeys = {
  all: ["pl-statement"] as const,
  dateRange: ["pl-statement", "date-range"] as const,
  statement: (startDate: Date, endDate: Date) =>
    ["pl-statement", "statement", startDate.toISOString(), endDate.toISOString()] as const,
};

interface UsePLStatementOptions {
  startDate: Date | undefined;
  endDate: Date | undefined;
  enabled?: boolean;
}

export function usePLStatement({ startDate, endDate, enabled = true }: UsePLStatementOptions) {
  // Fetch P&L statement
  const {
    data: statement,
    isLoading: statementLoading,
    error: statementError,
  } = useQuery({
    queryKey: startDate && endDate ? plStatementKeys.statement(startDate, endDate) : ["pl-statement", "none"],
    queryFn: async () => {
      if (!startDate || !endDate) return null;

      // Ensure end date includes full day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      const result = await getPLStatement("custom", startDate, adjustedEndDate);
      if (!result.success) {
        throw new Error(result.error || "Failed to load P&L statement");
      }
      return result.data;
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 30 * 1000, // 30 seconds - P&L data can change when transactions are categorized
  });

  return {
    statement: statement ?? null,
    isLoading: statementLoading,
    error: statementError,
  };
}

export function useTransactionDateRange() {
  const {
    data: dateRange,
    isLoading: dateRangeLoading,
  } = useQuery({
    queryKey: plStatementKeys.dateRange,
    queryFn: async () => {
      const result = await getTransactionDateRange();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch date range");
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    dateRange: dateRange ?? null,
    isLoading: dateRangeLoading,
  };
}
