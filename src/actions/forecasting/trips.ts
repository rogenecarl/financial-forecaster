"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { ImportTrip, Trip, TripLoad, UpdateTrip, TripFilter } from "@/schema/forecasting.schema";
import { updateTripSchema, tripFilterSchema } from "@/schema/forecasting.schema";
import { startOfWeek, endOfWeek, getWeek, getYear } from "date-fns";

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
// GET TRIPS BY WEEK
// ============================================

export async function getTripsByWeek(
  weekStart: Date
): Promise<ActionResponse<{ trips: TripSummary[]; stats: WeekStats }>> {
  try {
    const session = await requireAuth();

    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
        scheduledDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
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
    console.error("Failed to get trips by week:", error);
    return { success: false, error: "Failed to load trips" };
  }
}

export interface WeekStats {
  totalTrips: number;
  projectedLoads: number;
  actualLoads: number;
  updatedCount: number;
  completion: number;
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

export async function getTripsWithLoads(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResponse<{ trips: TripWithLoadsForTable[]; stats: WeekStats }>> {
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
      weekId: trip.weekId,
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
      },
    });

    // Update ForecastWeek if actual loads changed
    if (validated.actualLoads !== undefined) {
      await updateForecastWeekFromTrips(session.user.id, updated.scheduledDate);
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
// IMPORT TRIPS (Optimized with batch operations)
// ============================================

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

export async function importTrips(
  trips: ImportTrip[]
): Promise<ActionResponse<{ imported: number; updated: number; skipped: number }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Batch fetch all existing trips in one query
    const tripIds = trips.map((t) => t.tripId);
    const existingTrips = await prisma.trip.findMany({
      where: {
        userId,
        tripId: { in: tripIds },
      },
      select: { id: true, tripId: true },
    });

    const existingTripMap = new Map(existingTrips.map((t) => [t.tripId, t.id]));

    // Separate trips into updates and inserts
    const toUpdate: Array<{ dbId: string; data: ImportTrip }> = [];
    const toInsert: ImportTrip[] = [];

    for (const tripData of trips) {
      const existingId = existingTripMap.get(tripData.tripId);
      if (existingId) {
        toUpdate.push({ dbId: existingId, data: tripData });
      } else {
        toInsert.push(tripData);
      }
    }

    // Process updates in chunks to avoid transaction timeout
    const CHUNK_SIZE = 10;

    // Process updates
    if (toUpdate.length > 0) {
      const updateChunks = chunkArray(toUpdate, CHUNK_SIZE);

      for (const chunk of updateChunks) {
        await prisma.$transaction(async (tx) => {
          // Delete old loads for this chunk
          const chunkIds = chunk.map((t) => t.dbId);
          await tx.tripLoad.deleteMany({
            where: { tripDbId: { in: chunkIds } },
          });

          // Update trips
          for (const { dbId, data } of chunk) {
            await tx.trip.update({
              where: { id: dbId },
              data: {
                tripStage: mapTripStage(data.tripStage),
                projectedLoads: data.projectedLoads,
                estimatedAccessorial: data.estimatedAccessorial,
                projectedRevenue: data.projectedRevenue,
              },
            });
          }

          // Create loads for this chunk
          const chunkLoads = chunk.flatMap(({ dbId, data }) =>
            data.loads.map((load) => createLoadData(dbId, load))
          );

          if (chunkLoads.length > 0) {
            await tx.tripLoad.createMany({ data: chunkLoads });
          }
        }, { timeout: 30000 }); // 30 second timeout
      }
    }

    // Process inserts in chunks
    if (toInsert.length > 0) {
      const insertChunks = chunkArray(toInsert, CHUNK_SIZE);

      for (const chunk of insertChunks) {
        await prisma.$transaction(async (tx) => {
          // Create trips and collect their IDs
          const createdTrips: Array<{ id: string; tripId: string }> = [];

          for (const tripData of chunk) {
            const created = await tx.trip.create({
              data: {
                userId,
                tripId: tripData.tripId,
                tripStage: mapTripStage(tripData.tripStage),
                equipmentType: tripData.equipmentType || null,
                operatorType: tripData.operatorType || null,
                scheduledDate: tripData.scheduledDate,
                projectedLoads: tripData.projectedLoads,
                estimatedAccessorial: tripData.estimatedAccessorial || null,
                projectedRevenue: tripData.projectedRevenue || null,
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
        }, { timeout: 30000 }); // 30 second timeout
      }
    }

    // Update ForecastWeeks for the affected weeks (outside transaction for performance)
    const scheduledDates = trips.map((t) => t.scheduledDate);
    const uniqueWeekStarts = [...new Set(scheduledDates.map((d) => startOfWeek(d, { weekStartsOn: 1 }).getTime()))];

    // Update forecast weeks in parallel (chunk to avoid overwhelming the DB)
    const weekChunks = chunkArray(uniqueWeekStarts, 5);
    for (const weekChunk of weekChunks) {
      await Promise.all(
        weekChunk.map((weekStartTime) =>
          createOrUpdateForecastWeek(userId, new Date(weekStartTime))
        )
      );
    }

    return {
      success: true,
      data: {
        imported: toInsert.length,
        updated: toUpdate.length,
        skipped: 0,
      },
    };
  } catch (error) {
    console.error("Failed to import trips:", error);
    return { success: false, error: "Failed to import trips" };
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

    await prisma.trip.delete({ where: { id } });

    // Update ForecastWeek
    await updateForecastWeekFromTrips(session.user.id, trip.scheduledDate);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return { success: false, error: "Failed to delete trip" };
  }
}

// ============================================
// FORECAST WEEK HELPERS
// ============================================

async function createOrUpdateForecastWeek(userId: string, weekStart: Date) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
  const year = getYear(weekStart);

  // Get all trips for this week
  const trips = await prisma.trip.findMany({
    where: {
      userId,
      scheduledDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  const projectedTours = trips.length;
  const projectedLoads = trips.reduce((sum, t) => sum + t.projectedLoads, 0);
  const projectedTourPay = projectedTours * 452; // DTR rate
  const projectedAccessorials = trips.reduce((sum, t) => sum + toNumber(t.estimatedAccessorial), 0);
  const projectedTotal = projectedTourPay + projectedAccessorials;

  const existing = await prisma.forecastWeek.findFirst({
    where: {
      userId,
      weekStart,
    },
  });

  if (existing) {
    await prisma.forecastWeek.update({
      where: { id: existing.id },
      data: {
        projectedTours,
        projectedLoads,
        projectedTourPay,
        projectedAccessorials,
        projectedTotal,
      },
    });
  } else {
    await prisma.forecastWeek.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        weekNumber,
        year,
        projectedTours,
        projectedLoads,
        projectedTourPay,
        projectedAccessorials,
        projectedTotal,
      },
    });
  }
}

async function updateForecastWeekFromTrips(userId: string, tripDate: Date) {
  const weekStart = startOfWeek(tripDate, { weekStartsOn: 1 });
  await createOrUpdateForecastWeek(userId, weekStart);
}
