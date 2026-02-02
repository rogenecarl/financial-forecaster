"use client";

import { useState, useMemo, useCallback } from "react";
import { Upload, Truck, Package, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TripsImportModal, TripsTable, TripsBulkActions } from "@/components/forecasting";
import {
  WeekSelector,
  ImportBatchSelector,
  TripStatusFilter,
  type TripStatusValue,
} from "@/components/filters";
import {
  useTripsWithLoads,
  useWeekOptions,
  useImportBatchOptions,
  useTripStatusCounts,
} from "@/hooks";
import type { TripsFilterParams } from "@/actions/forecasting/trips";

export default function TripsPage() {
  // Filter state
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedImportBatchId, setSelectedImportBatchId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TripStatusValue>("all");
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch filter options
  const { weeks, isLoading: weeksLoading, invalidate: invalidateWeeks } = useWeekOptions();
  const { batches, isLoading: batchesLoading, invalidate: invalidateBatches } = useImportBatchOptions();
  const { statusCounts, isLoading: statusCountsLoading } = useTripStatusCounts(
    selectedWeekId ?? undefined,
    selectedImportBatchId ?? undefined
  );

  // Build filter params
  const filterParams = useMemo<TripsFilterParams>(() => {
    const params: TripsFilterParams = {};

    if (selectedWeekId) {
      params.weekId = selectedWeekId;
    }

    if (selectedImportBatchId) {
      params.importBatchId = selectedImportBatchId;
    }

    if (selectedStatus !== "all") {
      params.tripStage = selectedStatus;
    }

    return params;
  }, [selectedWeekId, selectedImportBatchId, selectedStatus]);

  // TanStack Query hook for trips data (with loads for detailed view)
  const {
    trips,
    stats,
    isLoading: loading,
    invalidate,
    bulkDelete,
    isBulkDeleting,
  } = useTripsWithLoads(filterParams);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    bulkDelete(selectedIds);
    setSelectedIds([]); // Clear selection immediately (optimistic)
  }, [selectedIds, bulkDelete]);

  // Handle import success - invalidate filters as well
  const handleImportSuccess = useCallback(() => {
    invalidate();
    invalidateWeeks();
    invalidateBatches();
  }, [invalidate, invalidateWeeks, invalidateBatches]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate canceled and active trips
  const canceledTrips = trips.filter((t) => t.tripStage === "CANCELED").length;
  const activeTrips = trips.filter((t) => t.tripStage !== "CANCELED");
  const activeTripsCount = activeTrips.length;
  const activeProjectedLoads = activeTrips.reduce((sum, t) => sum + t.projectedLoads, 0);

  // Exclude canceled trips from projected revenue (canceled trips don't generate projected revenue)
  const projectedRevenue = activeTrips.reduce((sum, t) => sum + (t.projectedRevenue || 0), 0);
  const actualRevenue = trips.reduce((sum, t) => sum + (t.actualRevenue || 0), 0);

  // Get selected week info for display
  const selectedWeek = weeks.find((w) => w.id === selectedWeekId);

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
        <Button onClick={() => setShowImport(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Trips
        </Button>
      </div>

      {/* Filters */}
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
        <TripStatusFilter
          statusCounts={statusCounts}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          loading={statusCountsLoading}
        />
      </div>

      {/* Active filter indicator */}
      {(selectedWeekId || selectedImportBatchId || selectedStatus !== "all") && (
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
          {selectedStatus !== "all" && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">
              {selectedStatus.replace("_", " ")}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setSelectedWeekId(null);
              setSelectedImportBatchId(null);
              setSelectedStatus("all");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : activeTripsCount}
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
              {loading ? <Skeleton className="h-8 w-12" /> : activeProjectedLoads}
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
        <Card className="bg-red-50/50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Canceled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {loading ? <Skeleton className="h-8 w-12" /> : canceledTrips}
            </div>
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
                  <p className="text-xs text-emerald-600">Based on $452.09 DTR + $34.12/load</p>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(projectedRevenue)}</p>
              </div>
              {canceledTrips > 0 && (
                <p className="text-xs text-emerald-600 mt-2 pt-2 border-t border-emerald-200">
                  Note: {canceledTrips} canceled {canceledTrips === 1 ? "trip is" : "trips are"} excluded from trip count and projected loads
                </p>
              )}
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
                {(selectedWeekId || selectedImportBatchId || selectedStatus !== "all")
                  ? "No trips found for the selected filters. Try changing or clearing the filters."
                  : "Import your trip schedule from Amazon Scheduler CSV to track projected vs actual loads."}
              </p>
              {(selectedWeekId || selectedImportBatchId || selectedStatus !== "all") ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWeekId(null);
                    setSelectedImportBatchId(null);
                    setSelectedStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Trips
                </Button>
              )}
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
        onSuccess={handleImportSuccess}
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
