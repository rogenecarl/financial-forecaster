# Phase 2: Create 3 New Custom Hooks

## New Files
1. `src/hooks/use-dashboard.ts`
2. `src/hooks/use-categories.ts`
3. `src/hooks/use-reports.ts`

---

## 2a. `src/hooks/use-dashboard.ts`

### Purpose
Wrap the `getDashboardData` server action in a TanStack Query hook so the dashboard can be a client component with cached data.

### Query Key Factory
```ts
export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
};
```

### Hook: `useDashboardData`
```ts
export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: async () => {
      const result = await getDashboardData();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute - dashboard aggregates 8 sub-queries
  });

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
```

### Design Decision
Not splitting into individual hooks for each metric because `getDashboardData` already aggregates 8 sub-queries via `Promise.all` server-side. Splitting would require 8 separate client-to-server round trips.

---

## 2b. `src/hooks/use-categories.ts`

### Purpose
Centralize category CRUD operations currently inline in `categories-section.tsx` and `category-form.tsx`.

### Query Key Factory
```ts
export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};
```

> **Note:** Uses `["categories"]` as base key — intentionally matching `transactionKeys.categories` so category invalidation cascades to the transactions page.

### Hooks

#### `useCategories()` — Query
```ts
export function useCategories() {
  // Calls getCategories() from @/actions/settings
  // Unwraps ActionResponse
  // Returns { categories, isLoading, error, invalidate }
}
```

#### `useCreateCategory()` — Mutation
```ts
export function useCreateCategory() {
  // Calls createCategory(data)
  // On success: invalidates categoryKeys.all, shows toast
  // Returns { create, createAsync, isPending, isSuccess, isError, error, reset }
}
```

#### `useUpdateCategory()` — Mutation
```ts
export function useUpdateCategory() {
  // Calls updateCategory(data)
  // On success: invalidates categoryKeys.all, shows toast
  // Returns { update, updateAsync, isPending, isSuccess, isError, error, reset }
}
```

#### `useDeleteCategory()` — Mutation
```ts
export function useDeleteCategory() {
  // Calls deleteCategory(id)
  // On success: invalidates categoryKeys.all, shows toast
  // Returns { deleteCategory, isPending, isSuccess, isError, error, reset }
}
```

### Pattern Reference
Follows the exact same patterns as `src/hooks/use-trip-batches.ts`:
- Separate query/mutation hooks
- Toast on success/error via `sonner`
- Query invalidation on mutation success
- `ActionResponse` unwrapping (throw on `!result.success`)

---

## 2c. `src/hooks/use-reports.ts`

### Purpose
Wrap report generation in `useMutation` hooks to replace the 5 manual `useState(false)` loading flags in `reports/page.tsx`.

### Design
These are **mutations, not queries** — they are user-triggered one-shot operations that produce file downloads. No cacheable data.

### Hooks (all mutations)

#### `useGenerateWeeklyPL()`
```ts
// mutationFn: calls getPLReportData("week", start, end) → generatePLPdf(data)
// onSuccess: toast success
// onError: toast error
// Returns { generate, generateAsync, isPending, ... }
```

#### `useGenerateMonthlyPL()`
```ts
// Same pattern as weekly, with "month" period type
```

#### `useExportTransactions()`
```ts
// mutationFn: calls getTransactionExportData(...) → generateTransactionsCsv(data)
```

#### `useExportForecast()`
```ts
// mutationFn: calls getForecastExportData(...) → generateForecastExcel(data)
```

#### `useGenerateCPAPackage()`
```ts
// mutationFn: calls getCPAPackageData(quarter) → generateCPAPackageZip(data)
```

### Usage in Reports Page
```ts
const weeklyPL = useGenerateWeeklyPL();

// Button:
onClick={() => weeklyPL.generate(params, {
  onSuccess: () => addRecentExport("filename.pdf", "pdf")
})}
disabled={!selectedWeek || weeklyPL.isPending}
```

The `addRecentExport` callback stays in the page component (not in the hook) because it depends on `localStorage` which is page-specific state.
