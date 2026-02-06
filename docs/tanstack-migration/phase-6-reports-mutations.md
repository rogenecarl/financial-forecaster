# Phase 6: Convert Reports Page to Use Mutation Hooks

## File to Modify
- `src/app/(dashboard)/reports/page.tsx`

## Current State
Uses 5 manual `useState(false)` loading flags and 5 async handler functions:

```ts
const [generatingWeeklyPL, setGeneratingWeeklyPL] = useState(false);
const [generatingMonthlyPL, setGeneratingMonthlyPL] = useState(false);
const [generatingTransactions, setGeneratingTransactions] = useState(false);
const [generatingForecast, setGeneratingForecast] = useState(false);
const [generatingCPA, setGeneratingCPA] = useState(false);
```

Each handler follows the same pattern:
1. Set loading true
2. Call server action
3. Check `result.success`
4. Generate file (PDF/CSV/Excel/ZIP)
5. Show toast
6. Set loading false

## What to Change

### 1. Remove manual loading states
Delete all 5 `useState(false)` declarations.

### 2. Remove handler functions
Delete: `handleGenerateWeeklyPL`, `handleGenerateMonthlyPL`, `handleExportTransactions`, `handleExportForecast`, `handleGenerateCPAPackage`.

### 3. Remove server action and export imports
```diff
- import {
-   getPLReportData,
-   getTransactionExportData,
-   getForecastExportData,
-   getCPAPackageData,
- } from "@/actions/reports/report-data";
- import { generatePLPdf } from "@/lib/export/pdf-export";
- import { generateForecastExcel } from "@/lib/export/excel-export";
- import { generateTransactionsCsv } from "@/lib/export/csv-export";
- import { generateCPAPackageZip } from "@/lib/export/zip-export";
```

### 4. Add mutation hooks
```ts
import {
  useGenerateWeeklyPL,
  useGenerateMonthlyPL,
  useExportTransactions,
  useExportForecast,
  useGenerateCPAPackage,
} from "@/hooks";

// In component:
const weeklyPL = useGenerateWeeklyPL();
const monthlyPL = useGenerateMonthlyPL();
const transactionExport = useExportTransactions();
const forecastExport = useExportForecast();
const cpaPackage = useGenerateCPAPackage();
```

### 5. Replace button handlers

**Weekly P&L button:**
```diff
- onClick={handleGenerateWeeklyPL}
- disabled={!selectedWeek || generatingWeeklyPL}
+ onClick={() => {
+   if (!selectedWeek) return;
+   weeklyPL.generate(
+     { periodType: "week", startDate: new Date(selectedWeek.weekStart), endDate: new Date(selectedWeek.weekEnd) },
+     { onSuccess: () => addRecentExport(`PL_Week_${selectedWeek.label}.pdf`, "pdf") }
+   );
+ }}
+ disabled={!selectedWeek || weeklyPL.isPending}
```

**Loading text:**
```diff
- {generatingWeeklyPL ? (
+ {weeklyPL.isPending ? (
```

Same pattern for all 5 report buttons.

### 6. Keep `addRecentExport` and `recentExports` state
The `addRecentExport` callback and `recentExports` localStorage state remain in the page component (not in hooks). Called via `onSuccess` callback when calling `mutate()`.

## Before vs After Comparison

### Before (57 lines of boilerplate per report):
```ts
const [generatingWeeklyPL, setGeneratingWeeklyPL] = useState(false);

const handleGenerateWeeklyPL = async () => {
  if (!selectedWeek) { toast.error("..."); return; }
  setGeneratingWeeklyPL(true);
  try {
    const result = await getPLReportData("week", ...);
    if (!result.success) { toast.error(...); return; }
    generatePLPdf(result.data);
    addRecentExport("...", "pdf");
    toast.success("...");
  } catch (error) {
    toast.error("...");
  } finally {
    setGeneratingWeeklyPL(false);
  }
};
```

### After (3 lines):
```ts
const weeklyPL = useGenerateWeeklyPL();

// In JSX:
onClick={() => weeklyPL.generate(params, { onSuccess: () => addRecentExport(...) })}
disabled={!selectedWeek || weeklyPL.isPending}
```
