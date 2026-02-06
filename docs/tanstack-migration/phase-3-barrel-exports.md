# Phase 3: Update Barrel Exports

## File to Modify
- `src/hooks/index.ts`

## Changes

Add exports for the 3 new hook files:

```ts
// Dashboard
export { useDashboardData, dashboardKeys } from "./use-dashboard"

// Categories
export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  categoryKeys,
} from "./use-categories"

// Reports
export {
  useGenerateWeeklyPL,
  useGenerateMonthlyPL,
  useExportTransactions,
  useExportForecast,
  useGenerateCPAPackage,
} from "./use-reports"
```

## Complete Hooks Index After Changes

The barrel export file will expose all hooks organized by domain:
- **Auth:** `useAuth`, `useRequireAuth`, `useSession`
- **Dashboard:** `useDashboardData` (NEW)
- **Transactions:** `useTransactions`
- **P&L:** `usePLStatement`, `useTransactionDateRange`
- **Forecasting:** `useAmazonInvoices`, `useTrips`, `useForecasts`, etc.
- **Trip Batches:** `useTripBatches`, `useTripBatch`, `useCreateTripBatch`, etc.
- **Analytics:** `useAnalyticsData`, `useYearlySummary`, etc.
- **Categories:** `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory` (NEW)
- **Reports:** `useGenerateWeeklyPL`, `useGenerateMonthlyPL`, `useExportTransactions`, `useExportForecast`, `useGenerateCPAPackage` (NEW)
- **Query Keys:** `dashboardKeys` (NEW), `transactionKeys`, `plStatementKeys`, `forecastingKeys`, `filterKeys`, `categoryKeys` (NEW)
