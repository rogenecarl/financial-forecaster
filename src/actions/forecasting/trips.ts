"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { Trip, TripLoad, UpdateTrip, TripFilter } from "@/schema/forecasting.schema";
import { updateTripSchema, tripFilterSchema } from "@/schema/forecasting.schema";
import { recalculateBatchMetrics } from "./trip-batches";

// ============================================
// TYPES
// ============================================

export type TripWithLoads = Trip & {
  loads: TripLoad[];
};

export type TripSummary = Pick<
  Trip,
  | "id"
  | "tripId"
  | "tripStage"
  | "scheduledDate"
  | "projectedLoads"
  | "actualLoads"
  | "projectedRevenue"
  | "actualRevenue"
  | "notes"
>;

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
// GET TRIPS
// ============================================

export async function getTrips(
  filters?: Partial<TripFilter>
): Promise<ActionResponse<{ trips: TripSummary[]; total: number }>> {
  try {
    const session = await requireAuth();

    const validated = tripFilterSchema.partial().parse(filters || {});
    const { weekStart, weekEnd, tripStage, page = 1, limit = 50 } = validated;

    const where = {
      userId: session.user.id,
      ...(weekStart && weekEnd
        ? {
            scheduledDate: {
              gte: weekStart,
              lte: weekEnd,
            },
          }
        : {}),
      ...(tripStage ? { tripStage } : {}),
    };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { scheduledDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tripId: true,
          tripStage: true,
          scheduledDate: true,
          projectedLoads: true,
          actualLoads: true,
          projectedRevenue: true,
          actualRevenue: true,
          notes: true,
        },
      }),
      prisma.trip.count({ where }),
    ]);

    const summaries: TripSummary[] = trips.map((trip) => ({
      id: trip.id,
      tripId: trip.tripId,
      tripStage: trip.tripStage,
      scheduledDate: trip.scheduledDate,
      projectedLoads: trip.projectedLoads,
      actualLoads: trip.actualLoads,
      projectedRevenue: toNumber(trip.projectedRevenue),
      actualRevenue: toNumber(trip.actualRevenue),
      notes: trip.notes,
    }));

    return { success: true, data: { trips: summaries, total } };
  } catch (error) {
    console.error("Failed to get trips:", error);
    return { success: false, error: "Failed to load trips" };
  }
}

// ============================================
// GET TRIPS BY BATCH
// ============================================

export interface WeekStats {
  totalTrips: number;
  projectedLoads: number;
  actualLoads: number;
  updatedCount: number;
  completion: number;
}

export async function getTripsForBatch(
  batchId: string,
  tripStage?: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED"
): Promise<ActionResponse<{ trips: TripSummary[]; stats: WeekStats }>> {
  try {
    const session = await requireAuth();

    const where: Record<string, unknown> = {
      userId: session.user.id,
      batchId,
    };

    if (tripStage) {
      where.tripStage = tripStage;
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { scheduledDate: "asc" },
      select: {
        id: true,
        tripId: true,
        tripStage: true,
        scheduledDate: true,
        projectedLoads: true,
        actualLoads: true,
        projectedRevenue: true,
        actualRevenue: true,
        notes: true,
      },
    });

    const summaries: TripSummary[] = trips.map((trip) => ({
      id: trip.id,
      tripId: trip.tripId,
      tripStage: trip.tripStage,
      scheduledDate: trip.scheduledDate,
      projectedLoads: trip.projectedLoads,
      actualLoads: trip.actualLoads,
      projectedRevenue: toNumber(trip.projectedRevenue),
      actualRevenue: toNumber(trip.actualRevenue),
      notes: trip.notes,
    }));

    // Calculate stats
    const stats: WeekStats = {
      totalTrips: trips.length,
      projectedLoads: trips.reduce((sum, t) => sum + t.projectedLoads, 0),
      actualLoads: trips.reduce((sum, t) => sum + (t.actualLoads || 0), 0),
      updatedCount: trips.filter((t) => t.actualLoads !== null).length,
      completion:
        trips.length > 0
          ? Math.round((trips.filter((t) => t.actualLoads !== null).length / trips.length) * 100)
          : 0,
    };

    return { success: true, data: { trips: summaries, stats } };
  } catch (error) {
    console.error("Failed to get trips for batch:", error);
    return { success: false, error: "Failed to load trips" };
  }
}

export interface TripDateRange {
  hasTrips: boolean;
  minDate: Date | null;
  maxDate: Date | null;
}

// ============================================
// GET TRIP DATE RANGE
// ============================================

export async function getTripDateRange(): Promise<ActionResponse<TripDateRange>> {
  try {
    const session = await requireAuth();

    const result = await prisma.trip.aggregate({
      where: { userId: session.user.id },
      _min: { scheduledDate: true },
      _max: { scheduledDate: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        hasTrips: result._count.id > 0,
        minDate: result._min.scheduledDate,
        maxDate: result._max.scheduledDate,
      },
    };
  } catch (error) {
    console.error("Failed to get trip date range:", error);
    return { success: false, error: "Failed to get trip date range" };
  }
}

// ============================================
// GET TRIPS WITH STATS (with optional date filter)
// ============================================

export async function getTripsWithStats(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResponse<{ trips: TripSummary[]; stats: WeekStats }>> {
  try {
    const session = await requireAuth();

    const where = {
      userId: session.user.id,
      ...(startDate && endDate
        ? {
            scheduledDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    };

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      select: {
        id: true,
        tripId: true,
        tripStage: true,
        scheduledDate: true,
        projectedLoads: true,
        actualLoads: true,
        projectedRevenue: true,
        actualRevenue: true,
        notes: true,
      },
    });

    const summaries: TripSummary[] = trips.map((trip) => ({
      id: trip.id,
      tripId: trip.tripId,
      tripStage: trip.tripStage,
      scheduledDate: trip.scheduledDate,
      projectedLoads: trip.projectedLoads,
      actualLoads: trip.actualLoads,
      projectedRevenue: toNumber(trip.projectedRevenue),
      actualRevenue: toNumber(trip.actualRevenue),
      notes: trip.notes,
    }));

    // Calculate stats
    const stats: WeekStats = {
      totalTrips: trips.length,
      projectedLoads: trips.reduce((sum, t) => sum + t.projectedLoads, 0),
      actualLoads: trips.reduce((sum, t) => sum + (t.actualLoads || 0), 0),
      updatedCount: trips.filter((t) => t.actualLoads !== null).length,
      completion:
        trips.length > 0
          ? Math.round((trips.filter((t) => t.actualLoads !== null).length / trips.length) * 100)
          : 0,
    };

    return { success: true, data: { trips: summaries, stats } };
  } catch (error) {
    console.error("Failed to get trips with stats:", error);
    return { success: false, error: "Failed to load trips" };
  }
}

// ============================================
// GET TRIPS WITH LOADS (for detailed view)
// ============================================

export type TripWithLoadsForTable = TripSummary & {
  loads: Array<{
    id: string;
    loadId: string;
    facilitySequence: string | null;
    loadExecutionStatus: string;
    isBobtail: boolean;
    estimateDistance: number;
    estimatedCost: number | null;
    stop1: string | null;
    stop1PlannedArr: Date | null;
    stop2: string | null;
    stop2PlannedArr: Date | null;
    stop3: string | null;
    stop3PlannedArr: Date | null;
    stop4: string | null;
    stop4PlannedArr: Date | null;
    stop5: string | null;
    stop5PlannedArr: Date | null;
    stop6: string | null;
    stop6PlannedArr: Date | null;
    stop7: string | null;
    stop7PlannedArr: Date | null;
  }>;
};

export interface TripsFilterParams {
  startDate?: Date;
  endDate?: Date;
  batchId?: string;
  tripStage?: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
}

export async function getTripsWithLoads(
  params?: TripsFilterParams
): Promise<ActionResponse<{ trips: TripWithLoadsForTable[]; stats: WeekStats }>> {
  try {
    const session = await requireAuth();
    const { startDate, endDate, batchId, tripStage } = params ?? {};

    // Build where clause with filters
    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    // Date range filter
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Batch filter
    if (batchId) {
      where.batchId = batchId;
    }

    // Trip stage filter
    if (tripStage) {
      where.tripStage = tripStage;
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      include: {
        loads: {
          orderBy: { loadId: "asc" },
          select: {
            id: true,
            loadId: true,
            facilitySequence: true,
            loadExecutionStatus: true,
            isBobtail: true,
            estimateDistance: true,
            estimatedCost: true,
            stop1: true,
            stop1PlannedArr: true,
            stop2: true,
            stop2PlannedArr: true,
            stop3: true,
            stop3PlannedArr: true,
            stop4: true,
            stop4PlannedArr: true,
            stop5: true,
            stop5PlannedArr: true,
            stop6: true,
            stop6PlannedArr: true,
            stop7: true,
            stop7PlannedArr: true,
          },
        },
      },
    });

    const tripsWithLoads: TripWithLoadsForTable[] = trips.map((trip) => ({
      id: trip.id,
      tripId: trip.tripId,
      tripStage: trip.tripStage,
      scheduledDate: trip.scheduledDate,
      projectedLoads: trip.projectedLoads,
      actualLoads: trip.actualLoads,
      projectedRevenue: toNumber(trip.projectedRevenue),
      actualRevenue: toNumber(trip.actualRevenue),
      notes: trip.notes,
      loads: trip.loads.map((load) => ({
        id: load.id,
        loadId: load.loadId,
        facilitySequence: load.facilitySequence,
        loadExecutionStatus: load.loadExecutionStatus,
        isBobtail: load.isBobtail,
        estimateDistance: toNumber(load.estimateDistance),
        estimatedCost: load.estimatedCost ? toNumber(load.estimatedCost) : null,
        stop1: load.stop1,
        stop1PlannedArr: load.stop1PlannedArr,
        stop2: load.stop2,
        stop2PlannedArr: load.stop2PlannedArr,
        stop3: load.stop3,
        stop3PlannedArr: load.stop3PlannedArr,
        stop4: load.stop4,
        stop4PlannedArr: load.stop4PlannedArr,
        stop5: load.stop5,
        stop5PlannedArr: load.stop5PlannedArr,
        stop6: load.stop6,
        stop6PlannedArr: load.stop6PlannedArr,
        stop7: load.stop7,
        stop7PlannedArr: load.stop7PlannedArr,
      })),
    }));

    // Calculate stats
    const stats: WeekStats = {
      totalTrips: trips.length,
      projectedLoads: trips.reduce((sum, t) => sum + t.projectedLoads, 0),
      actualLoads: trips.reduce((sum, t) => sum + (t.actualLoads || 0), 0),
      updatedCount: trips.filter((t) => t.actualLoads !== null).length,
      completion:
        trips.length > 0
          ? Math.round((trips.filter((t) => t.actualLoads !== null).length / trips.length) * 100)
          : 0,
    };

    return { success: true, data: { trips: tripsWithLoads, stats } };
  } catch (error) {
    console.error("Failed to get trips with loads:", error);
    return { success: false, error: "Failed to load trips" };
  }
}

// ============================================
// GET TRIP BY ID
// ============================================

export async function getTrip(id: string): Promise<ActionResponse<TripWithLoads>> {
  try {
    const session = await requireAuth();

    const trip = await prisma.trip.findFirst({
      where: { id, userId: session.user.id },
      include: {
        loads: {
          orderBy: { loadId: "asc" },
        },
      },
    });

    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const result: TripWithLoads = {
      id: trip.id,
      userId: trip.userId,
      batchId: trip.batchId,
      tripId: trip.tripId,
      tripStage: trip.tripStage,
      equipmentType: trip.equipmentType,
      operatorType: trip.operatorType,
      scheduledDate: trip.scheduledDate,
      projectedLoads: trip.projectedLoads,
      actualLoads: trip.actualLoads,
      estimatedAccessorial: toNumber(trip.estimatedAccessorial),
      projectedRevenue: toNumber(trip.projectedRevenue),
      actualRevenue: toNumber(trip.actualRevenue),
      notes: trip.notes,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      loads: trip.loads.map((load) => ({
        id: load.id,
        tripDbId: load.tripDbId,
        loadId: load.loadId,
        facilitySequence: load.facilitySequence,
        loadExecutionStatus: load.loadExecutionStatus,
        truckFilter: load.truckFilter,
        isBobtail: load.isBobtail,
        estimateDistance: toNumber(load.estimateDistance),
        estimatedCost: toNumber(load.estimatedCost),
        shipperAccount: load.shipperAccount,
        stop1: load.stop1,
        stop1PlannedArr: load.stop1PlannedArr,
        stop2: load.stop2,
        stop2PlannedArr: load.stop2PlannedArr,
        stop3: load.stop3,
        stop3PlannedArr: load.stop3PlannedArr,
        stop4: load.stop4,
        stop4PlannedArr: load.stop4PlannedArr,
        stop5: load.stop5,
        stop5PlannedArr: load.stop5PlannedArr,
        stop6: load.stop6,
        stop6PlannedArr: load.stop6PlannedArr,
        stop7: load.stop7,
        stop7PlannedArr: load.stop7PlannedArr,
        createdAt: load.createdAt,
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get trip:", error);
    return { success: false, error: "Failed to load trip" };
  }
}

// ============================================
// UPDATE TRIP (Actual Loads)
// ============================================

export async function updateTrip(data: UpdateTrip): Promise<ActionResponse<TripSummary>> {
  try {
    const session = await requireAuth();

    const validated = updateTripSchema.parse(data);

    const trip = await prisma.trip.findFirst({
      where: { id: validated.id, userId: session.user.id },
    });

    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const updated = await prisma.trip.update({
      where: { id: validated.id },
      data: {
        ...(validated.actualLoads !== undefined ? { actualLoads: validated.actualLoads } : {}),
        ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
        ...(validated.tripStage !== undefined ? { tripStage: mapTripStage(validated.tripStage) } : {}),
      },
      select: {
        id: true,
        tripId: true,
        tripStage: true,
        scheduledDate: true,
        projectedLoads: true,
        actualLoads: true,
        projectedRevenue: true,
        actualRevenue: true,
        notes: true,
        batchId: true,
      },
    });

    // Update TripBatch metrics if trip belongs to a batch
    if (updated.batchId) {
      await recalculateBatchMetrics(updated.batchId);
    }

    return {
      success: true,
      data: {
        id: updated.id,
        tripId: updated.tripId,
        tripStage: updated.tripStage,
        scheduledDate: updated.scheduledDate,
        projectedLoads: updated.projectedLoads,
        actualLoads: updated.actualLoads,
        projectedRevenue: toNumber(updated.projectedRevenue),
        actualRevenue: toNumber(updated.actualRevenue),
        notes: updated.notes,
      },
    };
  } catch (error) {
    console.error("Failed to update trip:", error);
    return { success: false, error: "Failed to update trip" };
  }
}

// ============================================
// DELETE TRIP
// ============================================

export async function deleteTrip(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();

    const trip = await prisma.trip.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const batchId = trip.batchId;

    await prisma.trip.delete({ where: { id } });

    // Update TripBatch metrics if trip belonged to a batch
    if (batchId) {
      await recalculateBatchMetrics(batchId);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return { success: false, error: "Failed to delete trip" };
  }
}

// ============================================
// BULK DELETE TRIPS
// ============================================

export async function bulkDeleteTrips(
  tripIds: string[]
): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const session = await requireAuth();

    if (tripIds.length === 0) {
      return { success: false, error: "No trips selected" };
    }

    // Get all trips to find their batch IDs
    const trips = await prisma.trip.findMany({
      where: {
        id: { in: tripIds },
        userId: session.user.id,
      },
      select: { id: true, batchId: true },
    });

    if (trips.length === 0) {
      return { success: false, error: "No trips found" };
    }

    // Collect unique batch IDs for metric updates
    const uniqueBatchIds = [...new Set(trips.map((t) => t.batchId).filter(Boolean))] as string[];

    // Delete trips (loads will be cascade deleted via Prisma relation)
    const deleteResult = await prisma.trip.deleteMany({
      where: {
        id: { in: trips.map((t) => t.id) },
        userId: session.user.id,
      },
    });

    // Update TripBatch metrics for affected batches
    await Promise.all(
      uniqueBatchIds.map((batchId) => recalculateBatchMetrics(batchId))
    );

    return {
      success: true,
      data: { deletedCount: deleteResult.count },
    };
  } catch (error) {
    console.error("Failed to bulk delete trips:", error);
    return { success: false, error: "Failed to delete trips" };
  }
}
