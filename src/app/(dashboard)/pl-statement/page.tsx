"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  AlertCircle,
  Circle,
  ChevronRight,
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
import { usePLStatement, useTransactionDateRange } from "@/hooks";
import type { PLLineItem } from "@/schema/transaction.schema";
import { cn } from "@/lib/utils";

type PeriodOption = "all" | "custom" | "thisMonth" | "lastMonth" | "last3Months";

export default function PLStatementPage() {
  const [periodOption, setPeriodOption] = useState<PeriodOption>("all");
  // Store custom dates as ISO strings to avoid Date object comparison issues
  const [customDateRange, setCustomDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  // Fetch available date range
  const { dateRange, isLoading: dateRangeLoading } = useTransactionDateRange();

  // Calculate the effective date range based on period selection
  const effectiveDateRange = useMemo(() => {
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
  }, [periodOption, dateRange, customDateRange]);

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

  const renderLineItem = (item: PLLineItem, isExpense: boolean = false) => (
    <div
      key={item.categoryId}
      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
    >
      <div className="flex items-center gap-3">
        <Circle
          className="h-3 w-3 flex-shrink-0"
          style={{ fill: item.categoryColor, color: item.categoryColor }}
        />
        <div>
          <span className="text-sm font-medium">{item.categoryName}</span>
          <span className="text-xs text-slate-500 ml-2">
            ({item.transactionCount} txn{item.transactionCount !== 1 ? "s" : ""})
          </span>
        </div>
      </div>
      <div className="text-right">
        <span
          className={cn(
            "text-sm font-mono font-medium",
            isExpense ? "text-red-600" : "text-green-600"
          )}
        >
          {isExpense && item.amount < 0 ? "" : isExpense ? "-" : "+"}
          {formatCurrency(Math.abs(item.amount))}
        </span>
        <span className="text-xs text-slate-500 ml-2">
          ({item.percentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  );

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        </div>

        {/* Statement Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
    (statement.revenue.items.length > 0 || statement.expenses.items.length > 0);

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
        <div className="flex flex-wrap gap-2">
          <Select
            value={periodOption}
            onValueChange={(value) => setPeriodOption(value as PeriodOption)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {periodOption === "custom" && (
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

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Data range info */}
      {dateRange?.hasTransactions && (
        <div className="text-sm text-muted-foreground">
          Available data: {formatDate(new Date(dateRange.minDate!))} - {formatDate(new Date(dateRange.maxDate!))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(statement?.revenue.total || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                (statement?.netProfit || 0) >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              )}
            >
              {formatCurrency(statement?.netProfit || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Statement */}
      {hasData ? (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>{getPeriodLabel()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3">
                Revenue
              </h3>
              <div className="bg-slate-50 rounded-lg p-4">
                {statement?.revenue.items.map((item) => renderLineItem(item))}
                {statement?.revenue.items.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No revenue recorded
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-slate-200">
                  <span className="text-sm font-semibold">Total Revenue</span>
                  <span className="text-sm font-mono font-bold text-green-600">
                    {formatCurrency(statement?.revenue.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3">
                Expenses
              </h3>
              <div className="bg-slate-50 rounded-lg p-4">
                {statement?.expenses.items.map((item) =>
                  renderLineItem(item, true)
                )}
                {statement?.expenses.items.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No expenses recorded
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-slate-200">
                  <span className="text-sm font-semibold">Total Expenses</span>
                  <span className="text-sm font-mono font-bold text-red-600">
                    -{formatCurrency(statement?.expenses.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-900 text-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Net Profit / (Loss)</span>
                <span
                  className={cn(
                    "text-2xl font-mono font-bold",
                    (statement?.netProfit || 0) >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}
                >
                  {formatCurrency(statement?.netProfit || 0)}
                </span>
              </div>
            </div>
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
                  ? "No categorized transactions found for the selected period."
                  : "Import and categorize transactions to generate your P&L statement."}
              </p>
              <Button variant="outline" asChild>
                <Link href="/transactions">
                  Go to Transactions
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
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
