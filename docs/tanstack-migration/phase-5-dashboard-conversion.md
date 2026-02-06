# Phase 5: Convert Dashboard from Server to Client Component

## File to Modify
- `src/app/(dashboard)/dashboard/page.tsx`

## Current State
Server Component (`async function DashboardPage()`) that:
1. Calls `getServerUser()` for the user's name
2. Calls `getDashboardData()` server action directly
3. Passes data as props to child components (all accept a `loading` prop)

## What to Change

### 1. Add client directive
```diff
+ "use client";
```

### 2. Change imports
```diff
- import { getServerUser } from "@/lib/auth-server";
- import { getDashboardData } from "@/actions/dashboard/dashboard";
+ import { useDashboardData, useAuth } from "@/hooks";
```

### 3. Change component signature
```diff
- export default async function DashboardPage() {
-   const user = await getServerUser();
-   const firstName = user?.name?.split(" ")[0] || "there";
-   const dashboardResult = await getDashboardData();
-   const dashboardData = dashboardResult.success ? dashboardResult.data : null;

+ export default function DashboardPage() {
+   const { user } = useAuth();
+   const firstName = user?.name?.split(" ")[0] || "there";
+   const { data: dashboardData, isLoading } = useDashboardData();
```

### 4. Update loading prop pattern
```diff
- loading={!dashboardData}
+ loading={isLoading || !dashboardData}
```

### Child Components — No Changes Needed
All dashboard child components already accept a `loading` prop:
- `MetricCard` → `loading={!hasMetrics}`
- `WeeklyForecastWidget` → `loading={!dashboardData}`
- `CashFlowChart` → `loading={!dashboardData}`
- `RecentTransactions` → `loading={!dashboardData}`
- `NextWeekPreviewCard` → `loading={!dashboardData}`
- `ModelAccuracyWidget` → `loading={!dashboardData}`
- `YearToDateSummary` → `loading={!dashboardData}`
- `ForecastVsActualTable` → `loading={!dashboardData}`

## Trade-offs

| Aspect | Before (Server Component) | After (Client + TanStack) |
|--------|--------------------------|---------------------------|
| First load | Pre-rendered HTML (no flash) | Shows loading skeletons |
| Subsequent navigations | Full server re-render | Instant (cached data) |
| Background updates | None | Auto-refetch when stale |
| Navigation speed | Slow (awaits server) | Fast (shows cache immediately) |

For a financial dashboard that users visit repeatedly during a session, **cached subsequent loads provide much better UX** than SSR-only first load.

## `formatCurrency` and `formatContributionMargin`
These helper functions defined in the page stay exactly as-is — they work the same in client components.
