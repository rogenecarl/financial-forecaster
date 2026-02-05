export { useAuth, type UseAuthReturn } from "./use-auth"
export { useRequireAuth } from "./use-require-auth"
export { useTransactions, transactionKeys } from "./use-transactions"
export { usePLStatement, useTransactionDateRange, plStatementKeys } from "./use-pl-statement"
export {
  useAmazonInvoices,
  useAmazonInvoiceDetail,
  useTrips,
  useTripsWithLoads,
  useTripDateRange,
  useForecasts,
  useInvoiceMatchingStats,
  forecastingKeys,
  // Filter hooks
  useTripBatchOptions,
  useTripStatusCounts,
  filterKeys,
} from "./use-forecasting"
export {
  // Trip Batch query hooks
  useTripBatches,
  useTripBatch,
  useTripBatchTrips,
  // Trip Batch mutation hooks
  useCreateTripBatch,
  useUpdateTripBatch,
  useDeleteTripBatch,
  useImportTripsToBatch,
  useImportInvoiceToBatch,
  useRecalculateBatchMetrics,
  // Types
  type TripBatchSummary,
  type TripBatchDetail,
  type TripBatchFilters,
  type CreateTripBatchInput,
  type UpdateTripBatchInput,
  type TripImportResult,
  type DuplicateFileCheckResult,
  type InvoiceImportResult,
  type DuplicateInvoiceFileCheckResult,
  type TripWithLoadsForTable,
} from "./use-trip-batches"
export {
  useAnalyticsData,
  useYearlySummary,
  useMonthlyBreakdown,
  useQuarterlySummary,
  useAccuracyTrend,
  useTopPerformingBatches,
  useHistoricalComparison,
  useAvailableYears,
} from "./use-analytics"
// Re-export useSession for direct access if needed
export { useSession } from "@/components/providers"
