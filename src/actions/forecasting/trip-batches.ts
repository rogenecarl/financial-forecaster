"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { ImportTrip } from "@/schema/forecasting.schema";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";
import type { BatchStatus } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

export interface TripBatchSummary {
  id: string;
  name: string;
  description: string | null;
  status: BatchStatus;
  tripCount: number;
  loadCount: number;
  canceledCount: number;
  completedCount: number;
  projectedTours: number;
  projectedLoads: number;
  projectedTourPay: number;
  projectedAccessorials: number;
  projectedTotal: number;
  actualTours: number | null;
  actualLoads: number | null;
  actualTourPay: number | null;
  actualAccessorials: number | null;
  actualAdjustments: number | null;
  actualTotal: number | null;
  variance: number | null;
  variancePercent: number | null;
  tripsImportedAt: Date | null;
  invoiceImportedAt: Date | null;
  createdAt: Date;
}

export interface TripBatchDetail extends TripBatchSummary {
  tripFileHash: string | null;
  invoiceFileHash: string | null;
  projectionLockedAt: Date | null;
}

export interface CreateTripBatchInput {
  name: string;
  description?: string;
}

export interface UpdateTripBatchInput {
  id: string;
  name?: string;
  description?: string;
}

// ============================================
// HELPERS
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toNumber === "function") return value.toNumber();
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function mapBatchToSummary(batch: {
  id: string;
  name: string;
  description: string | null;
  status: BatchStatus;
  tripCount: number;
  loadCount: number;
  canceledCount: number;
  completedCount: number;
  projectedTours: number;
  projectedLoads: number;
  projectedTourPay: unknown;
  projectedAccessorials: unknown;
  projectedTotal: unknown;
  actualTours: number | null;
  actualLoads: number | null;
  actualTourPay: unknown;
  actualAccessorials: unknown;
  actualAdjustments: unknown;
  actualTotal: unknown;
  variance: unknown;
  variancePercent: number | null;
  tripsImportedAt: Date | null;
  invoiceImportedAt: Date | null;
  createdAt: Date;
}): TripBatchSummary {
  return {
    id: batch.id,
    name: batch.name,
    description: batch.description,
    status: batch.status,
    tripCount: batch.tripCount,
    loadCount: batch.loadCount,
    canceledCount: batch.canceledCount,
    completedCount: batch.completedCount,
    projectedTours: batch.projectedTours,
    projectedLoads: batch.projectedLoads,
    projectedTourPay: toNumber(batch.projectedTourPay),
    projectedAccessorials: toNumber(batch.projectedAccessorials),
    projectedTotal: toNumber(batch.projectedTotal),
    actualTours: batch.actualTours,
    actualLoads: batch.actualLoads,
    actualTourPay: toNumberOrNull(batch.actualTourPay),
    actualAccessorials: toNumberOrNull(batch.actualAccessorials),
    actualAdjustments: toNumberOrNull(batch.actualAdjustments),
    actualTotal: toNumberOrNull(batch.actualTotal),
    variance: toNumberOrNull(batch.variance),
    variancePercent: batch.variancePercent,
    tripsImportedAt: batch.tripsImportedAt,
    invoiceImportedAt: batch.invoiceImportedAt,
    createdAt: batch.createdAt,
  };
}

function mapTripStage(stage: string): "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" {
  switch (stage) {
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELED":
      return "CANCELED";
    default:
      return "UPCOMING";
  }
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createTripBatch(
  input: CreateTripBatchInput
): Promise<ActionResponse<TripBatchSummary>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.tripBatch.create({
      data: {
        userId: session.user.id,
        name: input.name,
        description: input.description || null,
        status: "EMPTY",
      },
    });

    return {
      success: true,
      data: mapBatchToSummary(batch),
    };
  } catch (error) {
    console.error("Failed to create trip batch:", error);
    return { success: false, error: "Failed to create batch" };
  }
}

export async function updateTripBatch(
  input: UpdateTripBatchInput
): Promise<ActionResponse<TripBatchSummary>> {
  try {
    const session = await requireAuth();

    const existing = await prisma.tripBatch.findFirst({
      where: { id: input.id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Batch not found" };
    }

    const batch = await prisma.tripBatch.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });

    return {
      success: true,
      data: mapBatchToSummary(batch),
    };
  } catch (error) {
    console.error("Failed to update trip batch:", error);
    return { success: false, error: "Failed to update batch" };
  }
}

export async function deleteTripBatch(
  batchId: string
): Promise<ActionResponse<{ deletedTrips: number; deletedInvoices: number }>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.tripBatch.findFirst({
      where: { id: batchId, userId: session.user.id },
      include: {
        _count: {
          select: { trips: true, invoices: true },
        },
      },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    const tripCount = batch._count.trips;
    const invoiceCount = batch._count.invoices;

    // Delete batch (trips and invoices will have batchId set to null due to onDelete: SetNull)
    // But we want to fully delete, so delete trips first
    await prisma.trip.deleteMany({
      where: { batchId },
    });

    await prisma.amazonInvoice.deleteMany({
      where: { batchId },
    });

    await prisma.tripBatch.delete({
      where: { id: batchId },
    });

    return {
      success: true,
      data: { deletedTrips: tripCount, deletedInvoices: invoiceCount },
    };
  } catch (error) {
    console.error("Failed to delete trip batch:", error);
    return { success: false, error: "Failed to delete batch" };
  }
}

export async function getTripBatch(
  batchId: string
): Promise<ActionResponse<TripBatchDetail>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.tripBatch.findFirst({
      where: { id: batchId, userId: session.user.id },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    return {
      success: true,
      data: {
        ...mapBatchToSummary(batch),
        tripFileHash: batch.tripFileHash,
        invoiceFileHash: batch.invoiceFileHash,
        projectionLockedAt: batch.projectionLockedAt,
      },
    };
  } catch (error) {
    console.error("Failed to get trip batch:", error);
    return { success: false, error: "Failed to load batch" };
  }
}

export interface TripBatchFilters {
  status?: BatchStatus;
  search?: string;
  sortBy?: "createdAt" | "name" | "tripCount" | "projectedTotal";
  sortOrder?: "asc" | "desc";
}

export async function getTripBatches(
  filters?: TripBatchFilters
): Promise<ActionResponse<TripBatchSummary[]>> {
  try {
    const session = await requireAuth();

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, string> = {};
    const sortBy = filters?.sortBy || "createdAt";
    const sortOrder = filters?.sortOrder || "desc";
    orderBy[sortBy] = sortOrder;

    const batches = await prisma.tripBatch.findMany({
      where,
      orderBy,
    });

    return {
      success: true,
      data: batches.map(mapBatchToSummary),
    };
  } catch (error) {
    console.error("Failed to get trip batches:", error);
    return { success: false, error: "Failed to load batches" };
  }
}

// ============================================
// IMPORT TRIPS TO BATCH
// ============================================

export interface TripImportResult {
  imported: number;
  replaced: number; // How many trips were replaced (deleted before import)
  skipped: number; // Skipped because they exist in OTHER batches
  duplicateTripIds: string[];
  skippedInBatch: number; // Duplicates in CURRENT batch (APPEND mode)
  duplicateInBatchTripIds: string[]; // Their trip IDs
  batchId: string;
  // Projection snapshot for this import
  projectedTours: number;
  projectedLoads: number;
  projectedStops: number; // Delivery stops from active trips (non-MSP, non-bobtail)
  activeLoadCount: number; // Total Load IDs from active (non-canceled) trips
  projectedTourPay: number;
  projectedAccessorials: number;
  projectedTotal: number;
  // Stats
  loadCount: number;
  canceledCount: number;
}

export interface DuplicateFileCheckResult {
  isDuplicate: boolean;
  batchName?: string;
  importedAt?: Date;
}

export async function checkDuplicateTripFile(
  batchId: string,
  fileHash: string
): Promise<ActionResponse<DuplicateFileCheckResult>> {
  try {
    const session = await requireAuth();

    // Check if this file was imported to ANY batch (not just this one)
    const existingBatch = await prisma.tripBatch.findFirst({
      where: {
        userId: session.user.id,
        tripFileHash: fileHash,
        id: { not: batchId }, // Exclude current batch
      },
      select: {
        name: true,
        tripsImportedAt: true,
      },
    });

    if (existingBatch) {
      return {
        success: true,
        data: {
          isDuplicate: true,
          batchName: existingBatch.name,
          importedAt: existingBatch.tripsImportedAt || undefined,
        },
      };
    }

    return {
      success: true,
      data: { isDuplicate: false },
    };
  } catch (error) {
    console.error("Failed to check duplicate file:", error);
    return { success: false, error: "Failed to check for duplicate file" };
  }
}

// Helper to chunk an array into smaller batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper to create load data from a trip
function createLoadData(tripDbId: string, load: ImportTrip["loads"][0]) {
  return {
    tripDbId,
    loadId: load.loadId,
    facilitySequence: load.facilitySequence || null,
    loadExecutionStatus: load.loadExecutionStatus,
    truckFilter: load.truckFilter || null,
    isBobtail: load.isBobtail,
    estimateDistance: load.estimateDistance,
    estimatedCost: load.estimatedCost || null,
    shipperAccount: load.shipperAccount || null,
    stop1: load.stop1 || null,
    stop1PlannedArr: load.stop1PlannedArr || null,
    stop2: load.stop2 || null,
    stop2PlannedArr: load.stop2PlannedArr || null,
    stop3: load.stop3 || null,
    stop3PlannedArr: load.stop3PlannedArr || null,
    stop4: load.stop4 || null,
    stop4PlannedArr: load.stop4PlannedArr || null,
    stop5: load.stop5 || null,
    stop5PlannedArr: load.stop5PlannedArr || null,
    stop6: load.stop6 || null,
    stop6PlannedArr: load.stop6PlannedArr || null,
    stop7: load.stop7 || null,
    stop7PlannedArr: load.stop7PlannedArr || null,
  };
}

export async function importTripsToBatch(
  batchId: string,
  trips: ImportTrip[],
  fileHash?: string,
  mode: "REPLACE" | "APPEND" = "REPLACE"
): Promise<ActionResponse<TripImportResult>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify batch exists and belongs to user
    const batch = await prisma.tripBatch.findFirst({
      where: { id: batchId, userId },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    if (batch.projectionLockedAt) {
      return { success: false, error: "Cannot import trips - batch projections are locked (invoice already imported)" };
    }

    if (trips.length === 0) {
      return { success: false, error: "No trips to import" };
    }

    // Check if same file was imported before (to a DIFFERENT batch)
    if (fileHash) {
      const previousBatch = await prisma.tripBatch.findFirst({
        where: {
          userId,
          tripFileHash: fileHash,
          id: { not: batchId },
        },
      });

      if (previousBatch) {
        return {
          success: false,
          error: `DUPLICATE_FILE: This file was already imported to batch "${previousBatch.name}"`,
        };
      }
    }

    // Count existing trips in this batch (for reporting how many were replaced)
    const existingTripsInBatch = await prisma.trip.count({
      where: { batchId },
    });

    // REPLACE mode: DELETE all existing trips first
    // APPEND mode: Skip deletion, keep existing trips
    if (mode === "REPLACE" && existingTripsInBatch > 0) {
      await prisma.trip.deleteMany({
        where: { batchId },
      });
    }

    // Check for duplicate tripIds in OTHER batches
    const tripIds = trips.map((t) => t.tripId);
    const existingTripsInOtherBatches = await prisma.trip.findMany({
      where: {
        userId,
        tripId: { in: tripIds },
        batchId: { not: batchId },
      },
      select: { id: true, tripId: true, batch: { select: { name: true } } },
    });

    const existingTripIdsInOtherBatches = new Set(existingTripsInOtherBatches.map((t) => t.tripId));

    // APPEND mode: also check for duplicate tripIds in THIS batch
    let existingTripIdsInThisBatch = new Set<string>();
    if (mode === "APPEND" && existingTripsInBatch > 0) {
      const tripsInThisBatch = await prisma.trip.findMany({
        where: {
          batchId,
          tripId: { in: tripIds },
        },
        select: { tripId: true },
      });
      existingTripIdsInThisBatch = new Set(tripsInThisBatch.map((t) => t.tripId));
    }

    // Separate trips: filter out other-batch duplicates AND in-batch duplicates (APPEND)
    const tripsToImport = trips.filter(
      (t) => !existingTripIdsInOtherBatches.has(t.tripId) && !existingTripIdsInThisBatch.has(t.tripId)
    );
    const duplicateTrips = trips.filter((t) => existingTripIdsInOtherBatches.has(t.tripId));
    const duplicateInBatchTrips = trips.filter((t) => existingTripIdsInThisBatch.has(t.tripId));

    // Calculate projections from trips to import (excluding canceled)
    const { DTR_RATE, TRIP_ACCESSORIAL_RATE } = FORECASTING_CONSTANTS;
    const activeTripsToImport = tripsToImport.filter((t) => t.tripStage !== "CANCELED");
    const canceledTripsToImport = tripsToImport.filter((t) => t.tripStage === "CANCELED");

    const projectedTours = activeTripsToImport.length;
    const projectedLoads = activeTripsToImport.reduce((sum, t) => sum + t.projectedLoads, 0);
    const projectedStops = projectedLoads; // Delivery stops (non-MSP, non-bobtail)
    const activeLoadCount = activeTripsToImport.reduce((sum, t) => sum + t.loads.length, 0);
    const projectedTourPay = projectedTours * DTR_RATE;
    const projectedAccessorials = projectedTours * TRIP_ACCESSORIAL_RATE;
    const projectedTotal = projectedTourPay + projectedAccessorials;

    // Process inserts in chunks
    const CHUNK_SIZE = 10;

    if (tripsToImport.length > 0) {
      const insertChunks = chunkArray(tripsToImport, CHUNK_SIZE);

      for (const chunk of insertChunks) {
        await prisma.$transaction(async (tx) => {
          const createdTrips: Array<{ id: string; tripId: string }> = [];

          for (const tripData of chunk) {
            const created = await tx.trip.create({
              data: {
                userId,
                batchId,
                tripId: tripData.tripId,
                tripStage: mapTripStage(tripData.tripStage),
                equipmentType: tripData.equipmentType || null,
                operatorType: tripData.operatorType || null,
                scheduledDate: tripData.scheduledDate,
                projectedLoads: tripData.projectedLoads,
                estimatedAccessorial: tripData.estimatedAccessorial || null,
                projectedRevenue: tripData.projectedRevenue || null,
                originalProjectedLoads: tripData.projectedLoads,
                originalProjectedRevenue: tripData.projectedRevenue || null,
              },
              select: { id: true, tripId: true },
            });
            createdTrips.push(created);
          }

          // Create a map of tripId to dbId
          const newTripMap = new Map(createdTrips.map((t) => [t.tripId, t.id]));

          // Create loads for all trips in this chunk
          const chunkLoads = chunk.flatMap((tripData) => {
            const dbId = newTripMap.get(tripData.tripId)!;
            return tripData.loads.map((load) => createLoadData(dbId, load));
          });

          if (chunkLoads.length > 0) {
            await tx.tripLoad.createMany({ data: chunkLoads });
          }
        }, { timeout: 30000 });
      }
    }

    // Calculate final batch statistics
    // APPEND mode: query actual counts from DB (existing + new trips)
    // REPLACE mode: use only imported trips (current behavior)
    let totalTripCount: number;
    let totalLoadCount: number;
    let totalCanceledCount: number;
    let totalCompletedCount: number;
    let totalProjectedTours: number;
    let totalProjectedLoads: number;
    let totalProjectedTourPay: number;
    let totalProjectedAccessorials: number;
    let totalProjectedTotal: number;

    if (mode === "APPEND") {
      // Query all trips in this batch from DB for accurate totals
      const allBatchTrips = await prisma.trip.findMany({
        where: { batchId },
        select: {
          tripStage: true,
          projectedLoads: true,
          _count: { select: { loads: true } },
        },
      });

      const allActiveTrips = allBatchTrips.filter((t) => t.tripStage !== "CANCELED");
      totalTripCount = allBatchTrips.length;
      totalLoadCount = allActiveTrips.reduce((sum, t) => sum + t._count.loads, 0);
      totalCanceledCount = allBatchTrips.filter((t) => t.tripStage === "CANCELED").length;
      totalCompletedCount = allBatchTrips.filter((t) => t.tripStage === "COMPLETED").length;
      totalProjectedTours = allActiveTrips.length;
      totalProjectedLoads = allActiveTrips.reduce((sum, t) => sum + t.projectedLoads, 0);
      totalProjectedTourPay = totalProjectedTours * DTR_RATE;
      totalProjectedAccessorials = totalProjectedTours * TRIP_ACCESSORIAL_RATE;
      totalProjectedTotal = totalProjectedTourPay + totalProjectedAccessorials;
    } else {
      totalTripCount = tripsToImport.length;
      totalLoadCount = activeLoadCount;
      totalCanceledCount = canceledTripsToImport.length;
      totalCompletedCount = tripsToImport.filter((t) => t.tripStage === "COMPLETED").length;
      totalProjectedTours = activeTripsToImport.length;
      totalProjectedLoads = activeTripsToImport.reduce((sum, t) => sum + t.projectedLoads, 0);
      totalProjectedTourPay = totalProjectedTours * DTR_RATE;
      totalProjectedAccessorials = totalProjectedTours * TRIP_ACCESSORIAL_RATE;
      totalProjectedTotal = totalProjectedTourPay + totalProjectedAccessorials;
    }

    // Determine new status
    let newStatus: BatchStatus = "UPCOMING";
    if (totalTripCount === 0) {
      newStatus = "EMPTY";
    } else if (totalCompletedCount > 0 && totalCompletedCount < totalProjectedTours) {
      newStatus = "IN_PROGRESS";
    } else if (totalCompletedCount === totalProjectedTours && totalProjectedTours > 0) {
      newStatus = "COMPLETED";
    }

    await prisma.tripBatch.update({
      where: { id: batchId },
      data: {
        tripFileHash: fileHash || null,
        tripsImportedAt: new Date(),
        status: newStatus,
        tripCount: totalTripCount,
        loadCount: totalLoadCount,
        canceledCount: totalCanceledCount,
        completedCount: totalCompletedCount,
        projectedTours: totalProjectedTours,
        projectedLoads: totalProjectedLoads,
        projectedTourPay: totalProjectedTourPay,
        projectedAccessorials: totalProjectedAccessorials,
        projectedTotal: totalProjectedTotal,
      },
    });

    return {
      success: true,
      data: {
        imported: tripsToImport.length,
        replaced: mode === "REPLACE" ? existingTripsInBatch : 0,
        skipped: duplicateTrips.length,
        duplicateTripIds: duplicateTrips.map((t) => t.tripId),
        skippedInBatch: duplicateInBatchTrips.length,
        duplicateInBatchTripIds: duplicateInBatchTrips.map((t) => t.tripId),
        batchId,
        projectedTours,
        projectedLoads,
        projectedStops,
        activeLoadCount,
        projectedTourPay,
        projectedAccessorials,
        projectedTotal,
        loadCount: activeLoadCount,
        canceledCount: canceledTripsToImport.length,
      },
    };
  } catch (error) {
    console.error("Failed to import trips to batch:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to import trips" };
  }
}

// ============================================
// RECALCULATE BATCH METRICS
// ============================================

export async function recalculateBatchMetrics(
  batchId: string
): Promise<ActionResponse<TripBatchSummary>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.tripBatch.findFirst({
      where: { id: batchId, userId: session.user.id },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    // Get all trips for this batch
    const trips = await prisma.trip.findMany({
      where: { batchId },
      select: {
        tripStage: true,
        projectedLoads: true,
        actualLoads: true,
        projectedRevenue: true,
        actualRevenue: true,
        _count: { select: { loads: true } },
      },
    });

    const { DTR_RATE, TRIP_ACCESSORIAL_RATE } = FORECASTING_CONSTANTS;
    const activeTrips = trips.filter((t) => t.tripStage !== "CANCELED");

    const projectedTours = activeTrips.length;
    const projectedLoads = activeTrips.reduce((sum, t) => sum + t.projectedLoads, 0);
    const projectedTourPay = projectedTours * DTR_RATE;
    const projectedAccessorials = projectedTours * TRIP_ACCESSORIAL_RATE;
    const projectedTotal = projectedTourPay + projectedAccessorials;
    const loadCount = trips.reduce((sum, t) => sum + t._count.loads, 0);
    const canceledCount = trips.filter((t) => t.tripStage === "CANCELED").length;
    const completedCount = trips.filter((t) => t.tripStage === "COMPLETED").length;

    // Determine status
    let newStatus: BatchStatus = batch.status;
    if (batch.status !== "INVOICED") {
      if (trips.length === 0) {
        newStatus = "EMPTY";
      } else if (completedCount > 0 && completedCount < activeTrips.length) {
        newStatus = "IN_PROGRESS";
      } else if (completedCount === activeTrips.length && activeTrips.length > 0) {
        newStatus = "COMPLETED";
      } else {
        newStatus = "UPCOMING";
      }
    }

    const updateData: Record<string, unknown> = {
      tripCount: trips.length,
      loadCount,
      canceledCount,
      completedCount,
      status: newStatus,
    };

    // Only update projections if not locked
    if (!batch.projectionLockedAt) {
      updateData.projectedTours = projectedTours;
      updateData.projectedLoads = projectedLoads;
      updateData.projectedTourPay = projectedTourPay;
      updateData.projectedAccessorials = projectedAccessorials;
      updateData.projectedTotal = projectedTotal;
    }

    const updated = await prisma.tripBatch.update({
      where: { id: batchId },
      data: updateData,
    });

    return {
      success: true,
      data: mapBatchToSummary(updated),
    };
  } catch (error) {
    console.error("Failed to recalculate batch metrics:", error);
    return { success: false, error: "Failed to recalculate metrics" };
  }
}
