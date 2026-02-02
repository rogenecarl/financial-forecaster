"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import { startOfWeek, endOfWeek, getWeek, getYear, format, addWeeks } from "date-fns";
import { getWeekId, getWeekStartFromId } from "@/lib/week-utils";

// ============================================
// TYPES
// ============================================

export interface WeekOption {
  id: string; // Format: "2026-W05"
  year: number;
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  label: string; // "Jan 27 - Feb 2"
  fullLabel: string; // "Week 5: Jan 27 - Feb 2, 2026"
  hasTrips: boolean;
  tripCount: number;
  hasActuals: boolean; // Invoice imported / ForecastWeek has actuals
  status: "projected" | "in_progress" | "completed";
}

export interface ImportBatchOption {
  id: string;
  importedAt: Date;
  fileName: string;
  tripCount: number;
  newTripsCount: number;
  skippedCount: number;
  projectedTotal: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface TripStatusCount {
  status: string;
  count: number;
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

// ============================================
// GET WEEK OPTIONS
// ============================================

export async function getWeekOptions(): Promise<ActionResponse<WeekOption[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get all forecast weeks for the user
    const forecastWeeks = await prisma.forecastWeek.findMany({
      where: { userId },
      orderBy: { weekStart: "desc" },
      select: {
        id: true,
        weekStart: true,
        weekEnd: true,
        weekNumber: true,
        year: true,
        status: true,
        actualTotal: true,
        _count: {
          select: { trips: true },
        },
      },
    });

    // Also get weeks that have trips but no forecast week yet
    const tripsWithoutForecast = await prisma.trip.groupBy({
      by: ["scheduledDate"],
      where: { userId },
      _count: { id: true },
    });

    // Build a map of weeks with their data
    const weeksMap = new Map<string, WeekOption>();

    // Add forecast weeks
    for (const fw of forecastWeeks) {
      const weekId = getWeekId(fw.weekStart);
      const hasActuals = fw.actualTotal !== null;

      weeksMap.set(weekId, {
        id: weekId,
        year: fw.year,
        weekNumber: fw.weekNumber,
        weekStart: fw.weekStart,
        weekEnd: fw.weekEnd,
        label: `${format(fw.weekStart, "MMM d")} - ${format(fw.weekEnd, "MMM d")}`,
        fullLabel: `Week ${fw.weekNumber}: ${format(fw.weekStart, "MMM d")} - ${format(fw.weekEnd, "MMM d, yyyy")}`,
        hasTrips: fw._count.trips > 0,
        tripCount: fw._count.trips,
        hasActuals,
        status: hasActuals ? "completed" : fw.status === "IN_PROGRESS" ? "in_progress" : "projected",
      });
    }

    // Add weeks from trips that don't have forecast weeks
    for (const tripGroup of tripsWithoutForecast) {
      const weekStart = startOfWeek(tripGroup.scheduledDate, { weekStartsOn: 1 });
      const weekId = getWeekId(weekStart);

      if (!weeksMap.has(weekId)) {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const year = getYear(weekStart);
        const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

        weeksMap.set(weekId, {
          id: weekId,
          year,
          weekNumber,
          weekStart,
          weekEnd,
          label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
          fullLabel: `Week ${weekNumber}: ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
          hasTrips: true,
          tripCount: tripGroup._count.id,
          hasActuals: false,
          status: "projected",
        });
      }
    }

    // Add current week and next week if not present
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(currentWeekStart, 1);

    for (const weekStart of [currentWeekStart, nextWeekStart]) {
      const weekId = getWeekId(weekStart);
      if (!weeksMap.has(weekId)) {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const year = getYear(weekStart);
        const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

        weeksMap.set(weekId, {
          id: weekId,
          year,
          weekNumber,
          weekStart,
          weekEnd,
          label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
          fullLabel: `Week ${weekNumber}: ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
          hasTrips: false,
          tripCount: 0,
          hasActuals: false,
          status: "projected",
        });
      }
    }

    // Convert to array and sort by date descending
    const weeks = Array.from(weeksMap.values()).sort(
      (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
    );

    return { success: true, data: weeks };
  } catch (error) {
    console.error("Failed to get week options:", error);
    return { success: false, error: "Failed to load week options" };
  }
}

// ============================================
// GET IMPORT BATCH OPTIONS
// ============================================

export async function getImportBatchOptions(): Promise<ActionResponse<ImportBatchOption[]>> {
  try {
    const session = await requireAuth();

    const batches = await prisma.tripImportBatch.findMany({
      where: {
        userId: session.user.id,
        status: { not: "rolled_back" },
      },
      orderBy: { importedAt: "desc" },
      select: {
        id: true,
        importedAt: true,
        fileName: true,
        tripCount: true,
        newTripsCount: true,
        skippedCount: true,
        projectedTotal: true,
        periodStart: true,
        periodEnd: true,
      },
    });

    const options: ImportBatchOption[] = batches.map((b) => ({
      id: b.id,
      importedAt: b.importedAt,
      fileName: b.fileName,
      tripCount: b.tripCount,
      newTripsCount: b.newTripsCount,
      skippedCount: b.skippedCount,
      projectedTotal: toNumber(b.projectedTotal),
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
    }));

    return { success: true, data: options };
  } catch (error) {
    console.error("Failed to get import batch options:", error);
    return { success: false, error: "Failed to load import batches" };
  }
}

// ============================================
// GET TRIP STATUS COUNTS
// ============================================

export async function getTripStatusCounts(
  weekId?: string,
  importBatchId?: string
): Promise<ActionResponse<TripStatusCount[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Build where clause
    const where: {
      userId: string;
      scheduledDate?: { gte: Date; lte: Date };
      importBatchId?: string;
    } = { userId };

    if (weekId) {
      const weekStart = getWeekStartFromId(weekId);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      where.scheduledDate = { gte: weekStart, lte: weekEnd };
    }

    if (importBatchId) {
      where.importBatchId = importBatchId;
    }

    // Get counts grouped by status
    const statusCounts = await prisma.trip.groupBy({
      by: ["tripStage"],
      where,
      _count: { id: true },
    });

    const counts: TripStatusCount[] = statusCounts.map((sc) => ({
      status: sc.tripStage,
      count: sc._count.id,
    }));

    return { success: true, data: counts };
  } catch (error) {
    console.error("Failed to get trip status counts:", error);
    return { success: false, error: "Failed to load status counts" };
  }
}

// ============================================
// GET CURRENT WEEK INFO
// ============================================

export async function getCurrentWeekInfo(): Promise<
  ActionResponse<{
    currentWeekId: string;
    currentWeekStart: Date;
    currentWeekEnd: Date;
  }>
> {
  try {
    await requireAuth();

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekId = getWeekId(weekStart);

    return {
      success: true,
      data: {
        currentWeekId: weekId,
        currentWeekStart: weekStart,
        currentWeekEnd: weekEnd,
      },
    };
  } catch (error) {
    console.error("Failed to get current week info:", error);
    return { success: false, error: "Failed to get current week" };
  }
}

