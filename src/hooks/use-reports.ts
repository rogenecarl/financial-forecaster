"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPLReportData,
  getTransactionExportData,
  getForecastExportData,
  getCPAPackageData,
  type WeekOption,
  type MonthOption,
  type QuarterOption,
} from "@/actions/reports/report-data";
import { generatePLPdf } from "@/lib/export/pdf-export";
import { generateForecastExcel } from "@/lib/export/excel-export";
import { generateTransactionsCsv } from "@/lib/export/csv-export";
import { generateCPAPackageZip } from "@/lib/export/zip-export";

export function useGenerateWeeklyPL() {
  const mutation = useMutation({
    mutationFn: async (week: WeekOption) => {
      const result = await getPLReportData(
        "week",
        new Date(week.weekStart),
        new Date(week.weekEnd)
      );
      if (!result.success) throw new Error(result.error || "Failed to generate report");
      generatePLPdf(result.data);
      return week.label;
    },
    onSuccess: () => {
      toast.success("Weekly P&L Report generated successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate report");
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    data: mutation.data,
  };
}

export function useGenerateMonthlyPL() {
  const mutation = useMutation({
    mutationFn: async (month: MonthOption) => {
      const result = await getPLReportData(
        "month",
        new Date(month.monthStart),
        new Date(month.monthEnd)
      );
      if (!result.success) throw new Error(result.error || "Failed to generate report");
      generatePLPdf(result.data);
      return month.label;
    },
    onSuccess: () => {
      toast.success("Monthly P&L Report generated successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate report");
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    data: mutation.data,
  };
}

export function useExportTransactions() {
  const mutation = useMutation({
    mutationFn: async (params: {
      startDate?: Date;
      endDate?: Date;
      categories?: string[];
    }) => {
      const result = await getTransactionExportData(
        params.startDate,
        params.endDate,
        params.categories && params.categories.length > 0 ? params.categories : undefined
      );
      if (!result.success) throw new Error(result.error || "Failed to export transactions");
      if (result.data.transactions.length === 0) {
        throw new Error("No transactions found for the selected filters");
      }
      generateTransactionsCsv(result.data);
      return result.data.totalCount;
    },
    onSuccess: (count) => {
      toast.success(`Exported ${count} transactions`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to export transactions");
    },
  });

  return {
    exportData: mutation.mutate,
    exportDataAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    data: mutation.data,
  };
}

export function useExportForecast() {
  const mutation = useMutation({
    mutationFn: async (params: { startDate?: Date; endDate?: Date }) => {
      const result = await getForecastExportData(params.startDate, params.endDate);
      if (!result.success) throw new Error(result.error || "Failed to export forecast data");
      if (result.data.batches.length === 0) {
        throw new Error("No forecast data found for the selected period");
      }
      generateForecastExcel(result.data);
      return result.data.batches.length;
    },
    onSuccess: (count) => {
      toast.success(`Exported ${count} batches of forecast data`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to export forecast data");
    },
  });

  return {
    exportData: mutation.mutate,
    exportDataAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    data: mutation.data,
  };
}

export function useGenerateCPAPackage() {
  const mutation = useMutation({
    mutationFn: async (quarter: QuarterOption) => {
      const result = await getCPAPackageData(quarter);
      if (!result.success) throw new Error(result.error || "Failed to generate CPA package");
      await generateCPAPackageZip(result.data);
      return quarter.label;
    },
    onSuccess: () => {
      toast.success("CPA Package generated successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate CPA package");
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    data: mutation.data,
  };
}
