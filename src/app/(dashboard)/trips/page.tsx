"use client";

import { useState, useMemo, useCallback } from "react";
import { Upload, Truck, Package, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripsImportModal, TripsTable, TripsBulkActions } from "@/components/forecasting";
import { useTripsWithLoads, useTripDateRange } from "@/hooks";

type PeriodOption = "all" | "custom" | "thisMonth" | "lastMonth" | "last3Months" | "thisWeek" | "lastWeek";

export default function TripsPage() {
  const [periodOption, setPeriodOption] = useState<PeriodOption>("all");
  const [customDateRange, setCustomDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch available date range
  const { dateRange } = useTripDateRange();

  // Calculate effective date range
  const effectiveDateRange = useMemo(() => {
    const now = new Date();

    switch (periodOption) {
      case "all":
        return null;

      case "thisWeek": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "lastWeek": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() + diffToMonday);
        const start = new Date(thisMonday);
        start.setDate(thisMonday.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "lastMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "last3Months": {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "custom": {
        const start = customDateRange.start
          ? new Date(customDateRange.start)
          : dateRange?.minDate
            ? new Date(dateRange.minDate)
            : null;
        const end = customDateRange.end
          ? new Date(customDateRange.end)
          : dateRange?.maxDate
            ? new Date(dateRange.maxDate)
            : null;
        if (start && end) {
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return null;
      }

      default:
        return null;
    }
  }, [periodOption, customDateRange, dateRange]);

  // Get display values for custom date inputs
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

  // TanStack Query hook for trips data (with loads for detailed view)
  const { trips, stats, isLoading: loading, invalidate, bulkDelete, isBulkDeleting } = useTripsWithLoads(
    effectiveDateRange?.start,
    effectiveDateRange?.end
  );

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    bulkDelete(selectedIds);
    setSelectedIds([]); // Clear selection immediately (optimistic)
  }, [selectedIds, bulkDelete]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const projectedRevenue = trips.reduce((sum, t) => sum + (t.projectedRevenue || 0), 0);
  const actualRevenue = trips.reduce((sum, t) => sum + (t.actualRevenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trips</h1>
          <p className="text-sm text-muted-foreground">
            Manage scheduled trips and track actual loads
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
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
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

          <Button onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Trips
          </Button>
        </div>
      </div>

      {/* Data range info */}
      {dateRange?.hasTrips && (
        <div className="text-sm text-muted-foreground">
          Available data: {formatDate(new Date(dateRange.minDate!))} - {formatDate(new Date(dateRange.maxDate!))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.totalTrips}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.projectedLoads}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actual Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.actualLoads}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats.completion}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.updatedCount} of {stats.totalTrips} trips updated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      {!loading && trips.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Projected Revenue</p>
                  <p className="text-xs text-emerald-600">Based on $452 DTR + estimated accessorials</p>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(projectedRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          {actualRevenue > 0 && (
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Actual Revenue</p>
                    <p className="text-xs text-blue-600">From completed trips</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(actualRevenue)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Trips Table */}
      {trips.length > 0 || loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Trip Schedule</CardTitle>
            <CardDescription>
              Update actual loads each night to track variance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TripsTable
              trips={trips}
              loading={loading}
              onUpdate={invalidate}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <CardHeader>
            <CardTitle>Trip Schedule</CardTitle>
            <CardDescription>Import trips from Amazon Scheduler to track loads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No trips found
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {dateRange?.hasTrips
                  ? "No trips found for the selected period. Try changing the date filter."
                  : "Import your trip schedule from Amazon Scheduler CSV to track projected vs actual loads."}
              </p>
              <Button onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Trips
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800">
                Update actual loads each night
              </p>
              <p className="text-xs text-blue-700">
                Recording actual loads helps improve forecast accuracy and track variance from projected deliveries.
                Click on the Actual column to edit the number of loads delivered.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>Updated</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-500" />
          <span>Scheduled</span>
        </div>
      </div>

      {/* Import Modal */}
      <TripsImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={invalidate}
      />

      {/* Bulk Actions */}
      <TripsBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
