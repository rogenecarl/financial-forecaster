# TanStack Query Migration Plan

Apply TanStack Query consistently across all pages/components for better UX (faster loads, cached data, consistent loading/error states) — without changing any functionality.

## Overview

| Phase | Description | Files |
|-------|-------------|-------|
| [Phase 1](./tanstack-migration/phase-1-query-client-defaults.md) | Optimize QueryClient defaults | 1 modified |
| [Phase 2](./tanstack-migration/phase-2-create-new-hooks.md) | Create 3 new custom hooks | 3 new files |
| [Phase 3](./tanstack-migration/phase-3-barrel-exports.md) | Update barrel exports | 1 modified |
| [Phase 4](./tanstack-migration/phase-4-refactor-pages.md) | Refactor 6 pages to use custom hooks | 6 modified |
| [Phase 5](./tanstack-migration/phase-5-dashboard-conversion.md) | Convert Dashboard to client component | 1 modified |
| [Phase 6](./tanstack-migration/phase-6-reports-mutations.md) | Convert Reports page to use mutations | 1 modified |
| [Phase 7](./tanstack-migration/phase-7-verification.md) | Testing & verification | 0 files |

**Total: 3 new files, 10 modified files**

## Current State

### Pages already using TanStack Query correctly (no changes needed):
- `transactions/page.tsx` → uses `useTransactions` hook
- `forecasting/page.tsx` → uses `useForecasts` hook
- `pl-statement/page.tsx` → uses `usePLStatement` + `useTransactionDateRange`

### Pages using inline `useQuery`/`useMutation` (should use existing custom hooks):
- `trips/page.tsx` → has custom hooks available but not used
- `trips/[batchId]/page.tsx` → has custom hooks available but not used
- `analytics/page.tsx` → has custom hooks available but not used
- `forecast-vs-actual/page.tsx` → uses inline query
- `categories-section.tsx` → uses inline query/mutation

### Pages not using TanStack Query at all:
- `dashboard/page.tsx` → server component, calls actions directly
- `reports/page.tsx` → client component, uses manual `useState` loading flags
