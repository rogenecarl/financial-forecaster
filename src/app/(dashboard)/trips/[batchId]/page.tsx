"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MoreVertical,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TripBatchStatusBadge,
  TripBatchImportSection,
  TripBatchSummaryCard,
  TripBatchCreateModal,
  TripBatchDeleteDialog,
  TripsImportModal,
  InvoiceImportModal,
  TripsTable,
  TripsBulkActions,
  TripSummaryCards,
  InvoiceSummaryCards,
} from "@/components/forecasting";
import {
  TripStatusFilter,
  type TripStatusValue,
} from "@/components/filters";
import {
  getTripBatch,
  deleteTripBatch,
} from "@/actions/forecasting/trip-batches";
import {
  getTripsWithLoads,
  bulkDeleteTrips,
  type TripsFilterParams,
} from "@/actions/forecasting/trips";
import { getTripStatusCounts } from "@/actions/filters";
import { toast } from "sonner";
import { forecastingKeys } from "@/hooks";

export default function TripBatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const batchId = params.batchId as string;

  // Local state
  const [statusFilter, setStatusFilter] = useState<TripStatusValue>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showTripsImport, setShowTripsImport] = useState(false);
  const [showAddTrips, setShowAddTrips] = useState(false);
  const [showInvoiceImport, setShowInvoiceImport] = useState(false);

  // Fetch batch details
  const {
    data: batch,
    isLoading: batchLoading,
  } = useQuery({
    queryKey: forecastingKeys.tripBatchDetail(batchId),
    queryFn: async () => {
      const result = await getTripBatch(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Build trip filter params
  const tripFilterParams = useMemo<TripsFilterParams>(() => {
    const params: TripsFilterParams = { batchId };
    if (statusFilter !== "all") {
      params.tripStage = statusFilter;
    }
    return params;
  }, [batchId, statusFilter]);

  // Fetch trips for this batch
  const {
    data: tripsData,
    isLoading: tripsLoading,
  } = useQuery({
    queryKey: [...forecastingKeys.tripsList(tripFilterParams), "withLoads"],
    queryFn: async () => {
      const result = await getTripsWithLoads(tripFilterParams);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  const trips = tripsData?.trips ?? [];
  const stats = tripsData?.stats ?? {
    totalTrips: 0,
    projectedLoads: 0,
    actualLoads: 0,
    updatedCount: 0,
    completion: 0,
  };

  // Fetch status counts for filters
  const { data: statusCounts = [] } = useQuery({
    queryKey: ["filters", "statusCounts", batchId],
    queryFn: async () => {
      const result = await getTripStatusCounts(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Delete batch mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteTripBatch(batchId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`Deleted batch with ${data.deletedTrips} trips`);
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
      router.push("/trips");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch");
    },
  });

  // Bulk delete trips mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (tripIds: string[]) => {
      const result = await bulkDeleteTrips(tripIds);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCount} trips`);
      setSelectedIds([]);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete trips");
    },
  });

  // Invalidation helper
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatchDetail(batchId) });
    queryClient.invalidateQueries({ queryKey: forecastingKeys.trips });
    queryClient.invalidateQueries({ queryKey: ["filters", "statusCounts", batchId] });
  }, [queryClient, batchId]);

  // Handlers
  const handleBack = useCallback(() => {
    router.push("/trips");
  }, [router]);

  const handleEditSuccess = useCallback(
    () => {
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatchDetail(batchId) });
      queryClient.invalidateQueries({ queryKey: forecastingKeys.tripBatches });
      setShowEdit(false);
    },
    [queryClient, batchId]
  );

  const handleDeleteConfirm = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const handleImportSuccess = useCallback(() => {
    invalidateAll();
    setShowTripsImport(false);
    setShowAddTrips(false);
    setShowInvoiceImport(false);
  }, [invalidateAll]);

  const handleBulkDelete = useCallback(() => {
    bulkDeleteMutation.mutate(selectedIds);
  }, [bulkDeleteMutation, selectedIds]);

  // Render loading state
  if (batchLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Import section skeleton */}
        <TripBatchImportSection
          batch={null}
          loading={true}
          onImportTrips={() => {}}
          onAddTrips={() => {}}
          onImportInvoice={() => {}}
        />

        {/* Summary skeleton */}
        <TripBatchSummaryCard batch={null} loading={true} />

        {/* Table skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render not found state
  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Truck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Batch not found
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This batch may have been deleted or you don&apos;t have access to it.
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Batches
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {batch.name}
            </h1>
            <TripBatchStatusBadge status={batch.status} />
          </div>
          {batch.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {batch.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEdit(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Batch
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDelete(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Batch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Import Section */}
      <TripBatchImportSection
        batch={batch}
        onImportTrips={() => setShowTripsImport(true)}
        onAddTrips={() => setShowAddTrips(true)}
        onImportInvoice={() => setShowInvoiceImport(true)}
      />

      {/* Trip Summary Cards - shown when trips are imported */}
      <TripSummaryCards batch={batch} />

      {/* Invoice Summary Cards - shown when invoice is imported */}
      <InvoiceSummaryCards batch={batch} />

      {/* Summary Card */}
      <TripBatchSummaryCard batch={batch} />

      {/* Trips Table */}
      {trips.length > 0 || tripsLoading ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trips</CardTitle>
                <CardDescription>
                  {stats.totalTrips} trips in this batch
                </CardDescription>
              </div>
              <TripStatusFilter
                statusCounts={statusCounts}
                selectedStatus={statusFilter}
                onStatusChange={setStatusFilter}
                loading={false}
              />
            </div>
          </CardHeader>
          <CardContent>
            <TripsTable
              trips={trips}
              loading={tripsLoading}
              onUpdate={invalidateAll}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </CardContent>
        </Card>
      ) : batch.status === "EMPTY" ? (
        // Empty state for new batch
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No trips yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Import trips from your Amazon Scheduler CSV to get started.
              </p>
              <Button onClick={() => setShowTripsImport(true)}>
                Import Trips
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // No trips match filter
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No trips match the selected filter.
              </p>
              <Button variant="outline" onClick={() => setStatusFilter("all")}>
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <TripBatchCreateModal
        open={showEdit}
        onOpenChange={setShowEdit}
        onSuccess={handleEditSuccess}
        editBatch={batch}
      />

      {/* Delete Dialog */}
      <TripBatchDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        batch={batch}
        onSuccess={handleDeleteConfirm}
      />

      {/* Trips Import Modal (Replace) */}
      <TripsImportModal
        open={showTripsImport}
        onOpenChange={setShowTripsImport}
        onSuccess={handleImportSuccess}
        batchId={batchId}
        batchName={batch.name}
      />

      {/* Trips Import Modal (Append) */}
      <TripsImportModal
        open={showAddTrips}
        onOpenChange={setShowAddTrips}
        onSuccess={handleImportSuccess}
        batchId={batchId}
        batchName={batch.name}
        mode="APPEND"
      />

      {/* Invoice Import Modal */}
      <InvoiceImportModal
        open={showInvoiceImport}
        onOpenChange={setShowInvoiceImport}
        onSuccess={handleImportSuccess}
        batchId={batchId}
        batchName={batch.name}
      />

      {/* Bulk Actions */}
      <TripsBulkActions
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
      />
    </div>
  );
}
