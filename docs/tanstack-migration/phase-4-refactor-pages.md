# Phase 4: Refactor Pages to Use Custom Hooks

## Files to Modify (6)
1. `src/app/(dashboard)/trips/page.tsx`
2. `src/app/(dashboard)/trips/[batchId]/page.tsx`
3. `src/app/(dashboard)/analytics/page.tsx`
4. `src/app/(dashboard)/forecast-vs-actual/page.tsx`
5. `src/components/settings/categories-section.tsx`
6. `src/components/settings/category-form.tsx`

---

## 4a. `src/app/(dashboard)/trips/page.tsx`

### Current State
Imports `useQuery`, `useMutation`, `useQueryClient` from TanStack + `getTripBatches`, `deleteTripBatch` from actions + `forecastingKeys` from hooks.

### What to Change

**Remove imports:**
- `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`
- `getTripBatches`, `deleteTripBatch`, `type TripBatchSummary`, `type TripBatchFilters` from `@/actions/forecasting/trip-batches`
- `forecastingKeys` from `@/hooks`
- `type BatchStatus` from `@/lib/generated/prisma/client`

**Add imports:**
- `useTripBatches`, `useDeleteTripBatch`, `type TripBatchSummary`, `type TripBatchFilters` from `@/hooks`

**Replace inline query (lines 61-72):**
```diff
- const queryClient = useQueryClient();
- const { data: batches = [], isLoading } = useQuery({
-   queryKey: [...forecastingKeys.tripBatchesList(), filters],
-   queryFn: async () => { ... },
-   staleTime: 30 * 1000,
- });
+ const { batches, isLoading, invalidate } = useTripBatches(filters);
```

**Replace inline mutation (lines 75-88):**
```diff
- const deleteMutation = useMutation({
-   mutationFn: async (batchId: string) => { ... },
-   onSuccess: (data) => { ... },
-   onError: (err) => { ... },
- });
+ const { deleteBatch, isPending: isDeletePending } = useDeleteTripBatch();
```

**Replace handleCreateSuccess (lines 98-111):**
```diff
- queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
+ invalidate();
```

**Replace handleDeleteConfirm (lines 113-117):**
```diff
- deleteMutation.mutate(deletingBatch.id);
+ deleteBatch(deletingBatch.id);
```

---

## 4b. `src/app/(dashboard)/trips/[batchId]/page.tsx`

### Current State
Has 4 inline `useQuery` calls and 1 inline `useMutation`, all using `useQueryClient` directly.

### What to Change

**Remove imports:**
- `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`
- `getTripBatch` from `@/actions/forecasting/trip-batches`
- `getTripsWithLoads`, `bulkDeleteTrips`, `type TripsFilterParams` from `@/actions/forecasting/trips`
- `getTripStatusCounts` from `@/actions/filters`
- `forecastingKeys` from `@/hooks`

**Add imports:**
- `useTripBatch`, `useTripBatchTrips`, `useTripStatusCounts` from `@/hooks`

**Replace queries:**

1. **Batch details (lines 58-66):**
```diff
- const { data: batch, isLoading: batchLoading } = useQuery({
-   queryKey: forecastingKeys.tripBatchDetail(batchId),
-   queryFn: async () => { ... },
- });
+ const { batch, isLoading: batchLoading, invalidate: invalidateBatch } = useTripBatch(batchId);
```

2. **Trips with loads (lines 78-86):**
```diff
- const { data: tripsData, isLoading: tripsLoading } = useQuery({
-   queryKey: [...forecastingKeys.tripsList(tripFilterParams), "withLoads"],
-   queryFn: async () => { ... },
- });
+ const { trips: tripsRaw, stats, isLoading: tripsLoading, invalidate: invalidateTrips } = useTripBatchTrips(
+   batchId,
+   statusFilter !== "all" ? statusFilter : undefined
+ );
```

3. **Status counts (lines 98-106):**
```diff
- const { data: statusCounts = [] } = useQuery({
-   queryKey: ["filters", "statusCounts", batchId],
-   queryFn: async () => { ... },
- });
+ const { statusCounts } = useTripStatusCounts(batchId);
```

4. **Invoice line items (lines 109-118) — KEEP inline:**
This is a single-use, conditional query (only fetches when batch is INVOICED). Keep as inline `useQuery` since there's no reuse case.

5. **Bulk delete mutation (lines 121-137) — KEEP inline:**
Has page-specific invalidation logic. Keep as inline `useMutation`.

**Simplify `invalidateAll` (lines 140-148):**
```diff
- queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatchDetail(batchId) });
- queryClient.invalidateQueries({ queryKey: forecastingKeys.trips });
- queryClient.invalidateQueries({ queryKey: ["filters", "statusCounts", batchId] });
+ invalidateBatch();
+ invalidateTrips();
```

---

## 4c. `src/app/(dashboard)/analytics/page.tsx`

### Current State
Uses 2 inline `useQuery` calls for analytics data and historical comparison.

### What to Change

**Remove imports:**
- `useQuery` from `@tanstack/react-query`
- `getAnalyticsData`, `getHistoricalComparison` from `@/actions/analytics`

**Add imports:**
- `useAnalyticsData`, `useHistoricalComparison` from `@/hooks`

**Replace inline queries:**

```diff
- const { data: analyticsResult, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
-   queryKey: ["analytics", selectedYear],
-   queryFn: () => getAnalyticsData(selectedYear),
- });
+ const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalyticsData(selectedYear);

- const { data: comparisonResult, isLoading: comparisonLoading } = useQuery({
-   queryKey: ["historicalComparison", selectedYear, quarterNumber],
-   queryFn: () => getHistoricalComparison(selectedYear, undefined, quarterNumber),
- });
+ const { data: comparisonData, isLoading: comparisonLoading } = useHistoricalComparison(selectedYear, { quarter: quarterNumber });
```

**Remove manual unwrapping:**
```diff
- const analyticsData = analyticsResult?.success ? analyticsResult.data : null;
- const comparisonData = comparisonResult?.success ? comparisonResult.data : null;
```
The hooks already handle `ActionResponse` unwrapping.

---

## 4d. `src/app/(dashboard)/forecast-vs-actual/page.tsx`

### Current State
Uses 1 inline `useQuery` to fetch trip batches.

### What to Change

**Remove imports:**
- `useQuery` from `@tanstack/react-query`
- `getTripBatches`, `type TripBatchSummary` from `@/actions/forecasting/trip-batches`
- `forecastingKeys` from `@/hooks`

**Add imports:**
- `useTripBatches`, `type TripBatchSummary` from `@/hooks`

**Replace inline query (lines 43-53):**
```diff
- const { data: batches = [], isLoading } = useQuery({
-   queryKey: [...forecastingKeys.tripBatchesList(), { status: ... }],
-   queryFn: async () => { ... },
-   staleTime: 30 * 1000,
- });
+ const { batches, isLoading } = useTripBatches(
+   statusFilter === "all" ? undefined : { status: "INVOICED" }
+ );
```

Everything else (aggregateStats, displayBatches, rendering) stays identical.

---

## 4e. `src/components/settings/categories-section.tsx`

### Current State
Uses inline `useQuery` for categories and inline `useMutation` for deletion.

### What to Change

**Remove imports:**
- `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`
- `getCategories`, `deleteCategory` from `@/actions/settings`

**Add imports:**
- `useCategories`, `useDeleteCategory` from `@/hooks`

**Replace inline query (lines 57-60):**
```diff
- const queryClient = useQueryClient();
- const { data: categoriesResult, isLoading } = useQuery({
-   queryKey: ["categories"],
-   queryFn: () => getCategories(),
- });
+ const { categories, isLoading } = useCategories();
```

**Replace inline mutation (lines 62-79):**
```diff
- const deleteMutation = useMutation({
-   mutationFn: (id: string) => deleteCategory(id),
-   onSuccess: (result) => { ... },
-   onError: () => { ... },
- });
+ const { deleteCategory: deleteCat, isPending: isDeleting } = useDeleteCategory();
```

**Remove manual unwrapping (line 81):**
```diff
- const categories = categoriesResult?.success ? categoriesResult.data : [];
```

---

## 4f. `src/components/settings/category-form.tsx`

### Current State
Uses inline `useMutation` with `useQueryClient` for create/update.

### What to Change

**Remove imports:**
- `useMutation`, `useQueryClient` from `@tanstack/react-query`
- `toast` from `sonner` (handled by hooks)
- `createCategory`, `updateCategory` from `@/actions/settings`

**Add imports:**
- `useCreateCategory`, `useUpdateCategory` from `@/hooks`

**Replace single combined mutation (lines 98-117):**
```diff
- const queryClient = useQueryClient();
- const mutation = useMutation({
-   mutationFn: (data: CategoryFormData) => {
-     if (isEditing && category) return updateCategory({ id: category.id, ...data });
-     return createCategory(data);
-   },
-   onSuccess: (result) => { ... },
-   onError: () => { ... },
- });

+ const { createAsync, isPending: isCreating } = useCreateCategory();
+ const { updateAsync, isPending: isUpdating } = useUpdateCategory();
+ const isPending = isCreating || isUpdating;
```

**Replace onSubmit (lines 119-121):**
```diff
- const onSubmit = (data: CategoryFormData) => {
-   mutation.mutate(data);
- };

+ const onSubmit = async (data: CategoryFormData) => {
+   try {
+     if (isEditing && category) {
+       await updateAsync({ id: category.id, ...data });
+     } else {
+       await createAsync(data);
+     }
+     onClose();
+   } catch {
+     // Error toast handled by hooks
+   }
+ };
```

**Replace button disabled state (line 246):**
```diff
- disabled={mutation.isPending}
+ disabled={isPending}
```
