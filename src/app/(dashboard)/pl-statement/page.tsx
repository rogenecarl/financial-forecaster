"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { endOfWeek } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekSelector } from "@/components/filters";
import { usePLStatement, useTransactionDateRange, useWeekOptions } from "@/hooks";
import { getWeekStartFromId } from "@/lib/week-utils";
import type { PLSection } from "@/schema/transaction.schema";
import { PLLineItemRow } from "@/components/pl";
import { cn } from "@/lib/utils";

type PeriodOption = "all" | "custom" | "thisMonth" | "lastMonth" | "last3Months";

export default function PLStatementPage() {
  const [periodOption, setPeriodOption] = useState<PeriodOption>("all");
  // Store custom dates as ISO strings to avoid Date object comparison issues
  const [customDateRange, setCustomDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  // Phase 3 filter state
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  // Filter hooks
  const { weeks, isLoading: weeksLoading } = useWeekOptions();

  // Fetch available date range
  const { dateRange, isLoading: dateRangeLoading } = useTransactionDateRange();

  // Get selected week info for display
  const selectedWeek = weeks.find((w) => w.id === selectedWeekId);

  // Calculate the effective date range based on period selection
  // Week selection takes priority over period dropdown
  const effectiveDateRange = useMemo(() => {
    // Week selection takes priority
    if (selectedWeekId) {
      const weekStart = getWeekStartFromId(selectedWeekId);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return { start: weekStart, end: weekEnd };
    }

    if (!dateRange?.hasTransactions) return null;

    const now = new Date();

    switch (periodOption) {
      case "all":
        if (dateRange.minDate && dateRange.maxDate) {
          return {
            start: new Date(dateRange.minDate),
            end: new Date(dateRange.maxDate),
          };
        }
        return null;

      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
      }

      case "lastMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start, end };
      }

      case "last3Months": {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
      }

      case "custom": {
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
  }, [selectedWeekId, periodOption, dateRange, customDateRange]);

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

  // Handle week selection - clear period option when week is selected
  const handleWeekChange = (weekId: string | null) => {
    setSelectedWeekId(weekId);
    // When selecting a specific week, don't change period option
    // When clearing week selection, keep existing period option
  };

  // Handle period option change - clear week selection when period changes
  const handlePeriodChange = (value: string) => {
    setPeriodOption(value as PeriodOption);
    setSelectedWeekId(null); // Clear week selection when period changes
  };

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

  const hasActiveFilters = selectedWeekId !== null;

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

      {/* Phase 3 Filters */}
      <div className="flex flex-wrap gap-2">
        <WeekSelector
          weeks={weeks}
          selectedWeekId={selectedWeekId}
          onWeekChange={handleWeekChange}
          loading={weeksLoading}
        />
        <Select
          value={selectedWeekId ? "week" : periodOption}
          onValueChange={handlePeriodChange}
          disabled={selectedWeekId !== null}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={selectedWeekId ? "Week Selected" : undefined} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Data</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="last3Months">Last 3 Months</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {periodOption === "custom" && !selectedWeekId && (
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

      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtering by:</span>
          {selectedWeek && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
              Week {selectedWeek.weekNumber}: {selectedWeek.label}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setSelectedWeekId(null)}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Data range info */}
      {dateRange?.hasTransactions && !selectedWeekId && (
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
                {hasActiveFilters
                  ? "No categorized transactions found for the selected week. Try selecting a different week or clear the filter."
                  : dateRange?.hasTransactions
                  ? "No categorized transactions found for the selected period."
                  : "Import and categorize transactions to generate your P&L statement."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={() => setSelectedWeekId(null)}>
                  Clear Filter
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
