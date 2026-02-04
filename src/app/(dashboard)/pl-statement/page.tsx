"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  startOfWeek,
} from "date-fns";
import {
  Download,
  FileText,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PeriodTypeSelector,
  QuickSelectButtons,
  type PeriodType,
  type QuickSelectOption,
} from "@/components/filters";
import { MonthSelector } from "@/components/reports/month-selector";
import { QuarterSelector } from "@/components/reports/quarter-selector";
import { YearSelector } from "@/components/reports/year-selector";
import { usePLStatement, useTransactionDateRange } from "@/hooks";
import type { PLSection } from "@/schema/transaction.schema";
import type { MonthOption, QuarterOption } from "@/actions/reports/report-data";
import { PLLineItemRow } from "@/components/pl";
import { cn } from "@/lib/utils";

export default function PLStatementPage() {
  // Period type state
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [quickSelect, setQuickSelect] = useState<QuickSelectOption | undefined>("thisWeek");

  // Store custom dates as ISO strings to avoid Date object comparison issues
  const [customDateRange, setCustomDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  // Period-specific state
  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

  // Fetch available date range
  const { dateRange, isLoading: dateRangeLoading } = useTransactionDateRange();

  // Handle period type change
  const handlePeriodTypeChange = useCallback((type: PeriodType) => {
    setPeriodType(type);
    setQuickSelect(undefined);
    // Don't reset other selections, just change the view
  }, []);

  // Handle quick select
  const handleQuickSelect = useCallback((option: QuickSelectOption) => {
    setQuickSelect(option);
    const now = new Date();

    switch (option) {
      case "thisWeek": {
        setPeriodType("weekly");
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        setCustomDateRange({
          start: weekStart.toISOString(),
          end: endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString(),
        });
        break;
      }
      case "lastWeek": {
        setPeriodType("weekly");
        const weekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        setCustomDateRange({
          start: weekStart.toISOString(),
          end: endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString(),
        });
        break;
      }
      case "thisMonth": {
        setPeriodType("monthly");
        setSelectedMonth({
          monthStart: startOfMonth(now),
          monthEnd: endOfMonth(now),
          label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          month: now.getMonth(),
          year: now.getFullYear(),
        });
        break;
      }
      case "lastMonth": {
        setPeriodType("monthly");
        const lastMonth = subMonths(now, 1);
        setSelectedMonth({
          monthStart: startOfMonth(lastMonth),
          monthEnd: endOfMonth(lastMonth),
          label: lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          month: lastMonth.getMonth(),
          year: lastMonth.getFullYear(),
        });
        break;
      }
      case "thisQuarter": {
        setPeriodType("quarterly");
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        setSelectedQuarter({
          year: now.getFullYear(),
          quarter,
          quarterStart: startOfQuarter(now),
          quarterEnd: endOfQuarter(now),
          label: `Q${quarter} ${now.getFullYear()}`,
        });
        break;
      }
    }
  }, []);

  // Calculate the effective date range based on period type
  const effectiveDateRange = useMemo(() => {
    const now = new Date();

    switch (periodType) {
      case "weekly": {
        // Use custom date range for weekly view
        if (customDateRange.start && customDateRange.end) {
          return {
            start: new Date(customDateRange.start),
            end: new Date(customDateRange.end),
          };
        }
        // Default to current week
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        return { start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) };
      }

      case "monthly": {
        if (selectedMonth) {
          return {
            start: new Date(selectedMonth.monthStart),
            end: new Date(selectedMonth.monthEnd),
          };
        }
        // Default to current month
        return { start: startOfMonth(now), end: endOfMonth(now) };
      }

      case "quarterly": {
        if (selectedQuarter) {
          return {
            start: new Date(selectedQuarter.quarterStart),
            end: new Date(selectedQuarter.quarterEnd),
          };
        }
        // Default to current quarter
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      }

      case "yearly": {
        const year = selectedYear ?? now.getFullYear();
        return {
          start: startOfYear(new Date(year, 0, 1)),
          end: endOfYear(new Date(year, 0, 1)),
        };
      }

      case "custom": {
        if (!dateRange?.hasTransactions) return null;

        const start = customDateRange.start
          ? new Date(customDateRange.start)
          : dateRange.minDate
            ? new Date(dateRange.minDate)
            : null;
        const end = customDateRange.end
          ? new Date(customDateRange.end)
          : dateRange.maxDate
            ? new Date(dateRange.maxDate)
            : null;

        if (start && end) {
          return { start, end };
        }
        return null;
      }

      default:
        return null;
    }
  }, [periodType, selectedMonth, selectedQuarter, selectedYear, dateRange, customDateRange]);

  // Get display values for date inputs
  const customStartDate = customDateRange.start
    ? new Date(customDateRange.start)
    : dateRange?.minDate
      ? new Date(dateRange.minDate)
      : undefined;

  const customEndDate = customDateRange.end
    ? new Date(customDateRange.end)
    : dateRange?.maxDate
      ? new Date(dateRange.maxDate)
      : undefined;

  // Fetch P&L statement with TanStack Query
  const { statement, isLoading: statementLoading } = usePLStatement({
    startDate: effectiveDateRange?.start,
    endDate: effectiveDateRange?.end,
    enabled: !!effectiveDateRange,
  });

  const loading = dateRangeLoading || statementLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPeriodLabel = () => {
    if (!statement) return "";
    return `${formatDate(statement.period.startDate)} - ${formatDate(statement.period.endDate)}`;
  };

  const renderSection = (
    title: string,
    section: PLSection | undefined,
    isNegative: boolean = false
  ) => {
    if (!section || section.items.length === 0) return null;

    return (
      <div>
        <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3">
          {title}
        </h3>
        <div className="bg-slate-50 rounded-lg p-4">
          {section.items.map((item) => (
            <PLLineItemRow
              key={item.categoryId}
              item={item}
              isNegative={isNegative}
              startDate={effectiveDateRange!.start}
              endDate={effectiveDateRange!.end}
            />
          ))}
          <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-slate-200">
            <span className="text-sm font-semibold">Total {title}</span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                isNegative ? "text-red-600" : "text-green-600"
              )}
            >
              {formatCurrency(section.total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSubtotal = (
    label: string,
    amount: number,
    highlight: "primary" | "success" | "warning" = "primary"
  ) => {
    const bgClass = {
      primary: "bg-slate-800",
      success: "bg-emerald-800",
      warning: "bg-amber-800",
    }[highlight];

    const textClass = {
      primary: amount >= 0 ? "text-emerald-400" : "text-red-400",
      success: "text-emerald-300",
      warning: "text-amber-300",
    }[highlight];

    return (
      <div className={cn("text-white rounded-lg p-4", bgClass)}>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">{label}</span>
          <span className={cn("text-xl font-mono font-bold", textClass)}>
            {formatCurrency(amount)}
          </span>
        </div>
      </div>
    );
  };

  if (loading && !dateRange) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statement Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData =
    statement &&
    (statement.revenue.items.length > 0 ||
      statement.contraRevenue.items.length > 0 ||
      statement.cogs.items.length > 0 ||
      statement.operatingExpenses.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">P&L Statement</h1>
          <p className="text-sm text-muted-foreground">
            Financial performance summary
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Period Selection */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <PeriodTypeSelector
            value={periodType}
            onChange={handlePeriodTypeChange}
          />

          {/* Dynamic picker based on period type */}
          {periodType === "weekly" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-[140px]"
                value={customDateRange.start ? new Date(customDateRange.start).toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : null;
                  if (start) {
                    const weekStart = startOfWeek(start, { weekStartsOn: 1 });
                    setCustomDateRange({
                      start: weekStart.toISOString(),
                      end: endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString(),
                    });
                    setQuickSelect(undefined);
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">Week starting</span>
            </div>
          )}

          {periodType === "monthly" && (
            <MonthSelector
              value={selectedMonth}
              onChange={(month) => {
                setSelectedMonth(month);
                setQuickSelect(undefined);
              }}
            />
          )}

          {periodType === "quarterly" && (
            <QuarterSelector
              value={selectedQuarter}
              onChange={(quarter) => {
                setSelectedQuarter(quarter);
                setQuickSelect(undefined);
              }}
            />
          )}

          {periodType === "yearly" && (
            <YearSelector
              value={selectedYear}
              onChange={(year) => {
                setSelectedYear(year);
                setQuickSelect(undefined);
              }}
              minYear={dateRange?.minDate ? new Date(dateRange.minDate).getFullYear() : undefined}
              maxYear={new Date().getFullYear()}
            />
          )}

          {periodType === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-[140px]"
                value={customStartDate ? customStartDate.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    start: e.target.value || null,
                  }))
                }
                max={customEndDate ? customEndDate.toISOString().split("T")[0] : undefined}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                className="w-[140px]"
                value={customEndDate ? customEndDate.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    end: e.target.value || null,
                  }))
                }
                min={customStartDate ? customStartDate.toISOString().split("T")[0] : undefined}
              />
            </div>
          )}
        </div>

        {/* Quick Select Buttons */}
        <QuickSelectButtons
          selected={quickSelect}
          onSelect={handleQuickSelect}
        />
      </div>

      {/* Current period display */}
      {effectiveDateRange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
            {periodType === "weekly"
              ? `${formatDate(effectiveDateRange.start)} - ${formatDate(effectiveDateRange.end)}`
              : periodType === "monthly" && selectedMonth
              ? selectedMonth.label
              : periodType === "quarterly" && selectedQuarter
              ? selectedQuarter.label
              : periodType === "yearly" && selectedYear
              ? selectedYear.toString()
              : `${formatDate(effectiveDateRange.start)} - ${formatDate(effectiveDateRange.end)}`}
          </span>
        </div>
      )}

      {/* Data range info */}
      {dateRange?.hasTransactions && periodType === "custom" && (
        <div className="text-sm text-muted-foreground">
          Available data: {formatDate(new Date(dateRange.minDate!))} - {formatDate(new Date(dateRange.maxDate!))}
        </div>
      )}

      {/* Summary Cards - Multi-tier metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(statement?.netRevenue || 0)}
            </div>
            {statement && statement.contraRevenue.total !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                After {formatCurrency(Math.abs(statement.contraRevenue.total))} refunds
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gross Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                (statement?.grossProfit || 0) >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              )}
            >
              {formatCurrency(statement?.grossProfit || 0)}
            </div>
            {statement && statement.cogs.total !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                After {formatCurrency(Math.abs(statement.cogs.total))} COGS
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {(statement?.operatingIncome || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              Operating Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                (statement?.operatingIncome || 0) >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              )}
            >
              {formatCurrency(statement?.operatingIncome || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Operating Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                (statement?.operatingMargin || 0) >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              )}
            >
              {(statement?.operatingMargin || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Statement - Multi-tier Structure */}
      {hasData ? (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>{getPeriodLabel()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue Section */}
            {renderSection("Revenue", statement?.revenue, false)}

            {/* Contra-Revenue Section (if any) */}
            {statement?.contraRevenue && statement.contraRevenue.items.length > 0 && (
              renderSection("Contra-Revenue", statement.contraRevenue, false)
            )}

            {/* Net Revenue Subtotal */}
            {renderSubtotal("Net Revenue", statement?.netRevenue || 0, "primary")}

            {/* COGS Section */}
            {renderSection("Cost of Goods Sold", statement?.cogs, true)}

            {/* Gross Profit Subtotal */}
            <div className="bg-emerald-900 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Gross Profit</span>
                <span
                  className={cn(
                    "text-xl font-mono font-bold",
                    (statement?.grossProfit || 0) >= 0
                      ? "text-emerald-300"
                      : "text-red-400"
                  )}
                >
                  {formatCurrency(statement?.grossProfit || 0)}
                </span>
              </div>
            </div>

            {/* Operating Expenses Section */}
            {renderSection("Operating Expenses", statement?.operatingExpenses, true)}

            {/* Operating Income - Final Total */}
            <div className="bg-slate-900 text-white rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold">Operating Income</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Margin: {(statement?.operatingMargin || 0).toFixed(1)}%
                  </p>
                </div>
                <span
                  className={cn(
                    "text-2xl font-mono font-bold",
                    (statement?.operatingIncome || 0) >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}
                >
                  {formatCurrency(statement?.operatingIncome || 0)}
                </span>
              </div>
            </div>

            {/* Equity note (if any) */}
            {statement && statement.equityCount > 0 && (
              <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-medium">
                  Equity transactions excluded from P&L
                </p>
                <p className="text-xs mt-1">
                  {statement.equityCount} transaction{statement.equityCount !== 1 ? "s" : ""} totaling {formatCurrency(statement.equityAmount)} (Owner contributions/draws)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>{getPeriodLabel() || "No date range selected"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No financial data
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {dateRange?.hasTransactions
                  ? "No categorized transactions found for the selected period. Try selecting a different period."
                  : "Import and categorize transactions to generate your P&L statement."}
              </p>
              {dateRange?.hasTransactions ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPeriodType("custom");
                    setQuickSelect(undefined);
                  }}
                >
                  View All Data
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/transactions">
                    Go to Transactions
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning for uncategorized */}
      {statement && statement.uncategorizedCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {statement.uncategorizedCount} uncategorized transaction
                {statement.uncategorizedCount !== 1 ? "s" : ""} (
                {formatCurrency(Math.abs(statement.uncategorizedAmount))})
              </p>
              <p className="text-xs text-amber-700">
                These transactions are excluded from this statement
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions?uncategorizedOnly=true">
                Review
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
