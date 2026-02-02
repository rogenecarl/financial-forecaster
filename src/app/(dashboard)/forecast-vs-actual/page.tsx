"use client";

import { useState, useMemo } from "react";
import { format, endOfWeek } from "date-fns";
import { GitCompare, TrendingUp, TrendingDown, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WeekSelector, ImportBatchSelector } from "@/components/filters";
import {
  useForecastVariance,
  useForecastDateRange,
  useInvoiceMatchingStats,
  useWeekOptions,
  useImportBatchOptions,
} from "@/hooks";
import { getWeekStartFromId } from "@/lib/week-utils";

export default function ForecastVsActualPage() {
  // Phase 3 filter state
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedImportBatchId, setSelectedImportBatchId] = useState<string | null>(null);

  // Filter hooks
  const { weeks, isLoading: weeksLoading } = useWeekOptions();
  const { batches, isLoading: batchesLoading } = useImportBatchOptions();

  // Fetch available date range (for empty state messaging)
  const { dateRange } = useForecastDateRange();

  // Calculate effective date range from week selection
  const effectiveDateRange = useMemo(() => {
    if (!selectedWeekId) return null; // All weeks mode

    const weekStart = getWeekStartFromId(selectedWeekId);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return { start: weekStart, end: weekEnd };
  }, [selectedWeekId]);

  // Get selected week info for display
  const selectedWeek = weeks.find((w) => w.id === selectedWeekId);

  // TanStack Query hook for variance data
  const { data, isLoading: loading } = useForecastVariance(
    effectiveDateRange?.start,
    effectiveDateRange?.end
  );

  // Get invoice matching stats to show unmatched items
  const { matchingStats } = useInvoiceMatchingStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getVarianceColor = (value: number | null) => {
    if (value === null) return "text-muted-foreground";
    return value >= 0 ? "text-emerald-600" : "text-red-600";
  };

  const getVarianceIcon = (value: number | null) => {
    if (value === null) return null;
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const hasData = data && data.summary.projectedTotal > 0;
  const hasActiveFilters = selectedWeekId !== null || selectedImportBatchId !== null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast vs Actual</h1>
          <p className="text-sm text-muted-foreground">
            Compare predictions with actual Amazon payments
          </p>
        </div>
      </div>

      {/* Phase 3 Filters */}
      <div className="flex flex-wrap gap-2">
        <WeekSelector
          weeks={weeks}
          selectedWeekId={selectedWeekId}
          onWeekChange={setSelectedWeekId}
          loading={weeksLoading}
        />
        <ImportBatchSelector
          batches={batches}
          selectedBatchId={selectedImportBatchId}
          onBatchChange={setSelectedImportBatchId}
          loading={batchesLoading}
        />
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
          {selectedImportBatchId && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
              Import Batch
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setSelectedWeekId(null);
              setSelectedImportBatchId(null);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Data range info */}
      {dateRange?.hasData && !selectedWeekId && (
        <div className="text-sm text-muted-foreground">
          Available data: {formatDate(new Date(dateRange.minDate!))} - {formatDate(new Date(dateRange.maxDate!))}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-6">
              <div className="grid gap-6 sm:grid-cols-3 text-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <Skeleton className="h-8 w-32 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : hasData ? (
        <>
          {/* Period Info */}
          {data.period.startDate && data.period.endDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Showing {data.period.weekCount} week{data.period.weekCount !== 1 ? "s" : ""}: {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
              </span>
            </div>
          )}

          {/* Unmatched Invoice Items Alert */}
          {matchingStats && matchingStats.unmatchedCount > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5" />
                  Unmatched Invoice Items
                </CardTitle>
                <CardDescription className="text-amber-700">
                  {matchingStats.unmatchedCount} invoice line items ({formatCurrency(matchingStats.unmatchedPay)})
                  don&apos;t have matching trips in the database. These are not included in the &quot;Actual Revenue from completed trips&quot; calculation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div className="grid grid-cols-3 gap-4 text-amber-800 mb-2">
                    <div>
                      <span className="font-medium">Invoice Total:</span> {formatCurrency(matchingStats.totalInvoicePay)}
                    </div>
                    <div>
                      <span className="font-medium">Matched:</span> {formatCurrency(matchingStats.matchedPay)}
                    </div>
                    <div>
                      <span className="font-medium">Unmatched:</span> {formatCurrency(matchingStats.unmatchedPay)}
                    </div>
                  </div>
                  <details className="text-amber-700">
                    <summary className="cursor-pointer hover:underline">
                      View unmatched trip IDs ({matchingStats.unmatchedItems.length})
                    </summary>
                    <ul className="mt-2 pl-4 space-y-0.5 max-h-32 overflow-y-auto font-mono text-xs">
                      {matchingStats.unmatchedItems.map((item, i) => (
                        <li key={i}>
                          {item.tripId} - {item.itemType}: {formatCurrency(item.grossPay)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variance Summary */}
          <Card>
            <CardContent className="py-6">
              <div className="grid gap-6 sm:grid-cols-3 text-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Forecast</p>
                  <p className="text-3xl font-bold">{formatCurrency(data.summary.projectedTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Actual</p>
                  <p className="text-3xl font-bold">
                    {data.summary.actualTotal !== null
                      ? formatCurrency(data.summary.actualTotal)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Variance</p>
                  <p className={`text-3xl font-bold ${getVarianceColor(data.summary.variance)}`}>
                    {data.summary.variance !== null ? (
                      <>
                        {data.summary.variance >= 0 ? "+" : ""}
                        {formatCurrency(data.summary.variance)} ({formatPercent(data.summary.variancePercent)})
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {data.summary.actualTotal !== null && (
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-3 max-w-md w-full">
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          data.summary.variance && data.summary.variance >= 0
                            ? "bg-emerald-500"
                            : "bg-primary"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (data.summary.actualTotal / data.summary.projectedTotal) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {getVarianceIcon(data.summary.variance)}
                      {data.summary.variance !== null && data.summary.variance >= 0
                        ? "Better than expected"
                        : data.summary.variance !== null
                        ? "Below forecast"
                        : "No comparison"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Variance Breakdown</CardTitle>
              <CardDescription>Detailed comparison by component</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.breakdown.map((row) => (
                      <TableRow
                        key={row.component}
                        className={row.component === "TOTAL" ? "font-medium bg-muted/50" : ""}
                      >
                        <TableCell>{row.component}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.forecast)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.actual !== 0 || row.component === "Adjustments"
                            ? formatCurrency(row.actual)
                            : "-"}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums ${getVarianceColor(row.variance)}`}>
                          {row.variance !== 0 ? (
                            <>
                              {row.variance >= 0 ? "+" : ""}
                              {formatCurrency(row.variance)}
                              {row.variancePercent !== null && (
                                <span className="text-xs ml-1">
                                  ({formatPercent(row.variancePercent)})
                                </span>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Breakdown (only show if multiple weeks) */}
          {data.weeklyBreakdown.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
                <CardDescription>
                  Variance by week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead className="text-right">Forecast</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.weeklyBreakdown.map((week) => (
                        <TableRow key={week.weekStart.toString()}>
                          <TableCell>
                            {format(new Date(week.weekStart), "MMM d")} - {format(new Date(week.weekEnd), "MMM d")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(week.projectedTotal)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {week.actualTotal !== null ? formatCurrency(week.actualTotal) : "-"}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${getVarianceColor(week.variance)}`}>
                            {week.variance !== null ? (
                              <>
                                {week.variance >= 0 ? "+" : ""}
                                {formatCurrency(week.variance)}
                                {week.variancePercent !== null && (
                                  <span className="text-xs ml-1">
                                    ({formatPercent(week.variancePercent)})
                                  </span>
                                )}
                              </>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trip-Level Variance */}
          {data.tripVariances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trip-Level Variance</CardTitle>
                <CardDescription>
                  Compare projected vs actual for each trip ({data.tripVariances.length} trips)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip ID</TableHead>
                        <TableHead className="text-center">Proj. Loads</TableHead>
                        <TableHead className="text-center">Act. Loads</TableHead>
                        <TableHead className="text-right">Proj. Pay</TableHead>
                        <TableHead className="text-right">Act. Pay</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tripVariances.map((trip) => (
                        <TableRow key={trip.tripDbId}>
                          <TableCell className="font-mono text-sm">{trip.tripId}</TableCell>
                          <TableCell className="text-center">{trip.projectedLoads}</TableCell>
                          <TableCell className="text-center">
                            {trip.actualLoads !== null ? trip.actualLoads : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(trip.projectedPay)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {trip.actualPay !== null ? formatCurrency(trip.actualPay) : "-"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                trip.status === "Updated"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : trip.status === "Canceled"
                                  ? "bg-red-100 text-red-800"
                                  : trip.status === "Pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {trip.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardHeader>
            <CardTitle>Variance Breakdown</CardTitle>
            <CardDescription>Detailed comparison by component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <GitCompare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No comparison data
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {hasActiveFilters
                  ? "No data found for the selected filters. Try changing or clearing the filters."
                  : dateRange?.hasData
                  ? "Select a week to view variance analysis."
                  : "Import trips for forecasting and Amazon invoices for actuals to see variance analysis."}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWeekId(null);
                    setSelectedImportBatchId(null);
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="/trips">Import Trips</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/amazon-invoices">Import Invoices</a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>Better than forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <span>Below forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Adjustment (TONU, etc.)</span>
        </div>
      </div>
    </div>
  );
}
