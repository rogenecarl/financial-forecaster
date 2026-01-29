"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { ForecastWeek, VarianceBreakdown, TripVariance } from "@/schema/forecasting.schema";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

// ============================================
// TYPES
// ============================================

export interface ForecastWeekWithVariance extends ForecastWeek {
  accuracy: number | null;
}

export interface WeeklyVariance {
  week: ForecastWeek;
  breakdown: VarianceBreakdown[];
  tripVariances: TripVariance[];
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
  return Number(value) || null;
}

function calculateVariancePercent(forecast: number, actual: number | null): number | null {
  if (actual === null || forecast === 0) return null;
  return ((actual - forecast) / Math.abs(forecast)) * 100;
}

function calculateAccuracy(forecast: number, actual: number | null): number | null {
  if (actual === null || forecast === 0) return null;
  const variance = Math.abs(actual - forecast);
  const accuracy = Math.max(0, (1 - variance / forecast) * 100);
  return Math.round(accuracy);
}

// ============================================
// GET FORECAST WEEKS
// ============================================

export async function getForecastWeeks(
  count: number = 8
): Promise<ActionResponse<ForecastWeekWithVariance[]>> {
  try {
    const session = await requireAuth();

    const weeks = await prisma.forecastWeek.findMany({
      where: { userId: session.user.id },
      orderBy: { weekStart: "desc" },
      take: count,
    });

    const result: ForecastWeekWithVariance[] = weeks.map((week) => ({
      id: week.id,
      userId: week.userId,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      weekNumber: week.weekNumber,
      year: week.year,
      truckCount: week.truckCount,
      nightsCount: week.nightsCount,
      projectedTours: week.projectedTours,
      projectedLoads: week.projectedLoads,
      projectedTourPay: toNumber(week.projectedTourPay),
      projectedAccessorials: toNumber(week.projectedAccessorials),
      projectedTotal: toNumber(week.projectedTotal),
      actualTours: week.actualTours,
      actualLoads: week.actualLoads,
      actualTourPay: toNumberOrNull(week.actualTourPay),
      actualAccessorials: toNumberOrNull(week.actualAccessorials),
      actualAdjustments: toNumberOrNull(week.actualAdjustments),
      actualTotal: toNumberOrNull(week.actualTotal),
      variance: toNumberOrNull(week.variance),
      variancePercent: week.variancePercent,
      amazonInvoiceId: week.amazonInvoiceId,
      notes: week.notes,
      status: week.status,
      createdAt: week.createdAt,
      updatedAt: week.updatedAt,
      accuracy: calculateAccuracy(toNumber(week.projectedTotal), toNumberOrNull(week.actualTotal)),
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get forecast weeks:", error);
    return { success: false, error: "Failed to load forecast weeks" };
  }
}

// ============================================
// GET FORECAST WEEK BY DATE
// ============================================

export async function getForecastWeekByDate(
  date: Date
): Promise<ActionResponse<ForecastWeekWithVariance | null>> {
  try {
    const session = await requireAuth();

    const weekStart = startOfWeek(date, { weekStartsOn: 1 });

    const week = await prisma.forecastWeek.findFirst({
      where: {
        userId: session.user.id,
        weekStart,
      },
    });

    if (!week) {
      return { success: true, data: null };
    }

    const result: ForecastWeekWithVariance = {
      id: week.id,
      userId: week.userId,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      weekNumber: week.weekNumber,
      year: week.year,
      truckCount: week.truckCount,
      nightsCount: week.nightsCount,
      projectedTours: week.projectedTours,
      projectedLoads: week.projectedLoads,
      projectedTourPay: toNumber(week.projectedTourPay),
      projectedAccessorials: toNumber(week.projectedAccessorials),
      projectedTotal: toNumber(week.projectedTotal),
      actualTours: week.actualTours,
      actualLoads: week.actualLoads,
      actualTourPay: toNumberOrNull(week.actualTourPay),
      actualAccessorials: toNumberOrNull(week.actualAccessorials),
      actualAdjustments: toNumberOrNull(week.actualAdjustments),
      actualTotal: toNumberOrNull(week.actualTotal),
      variance: toNumberOrNull(week.variance),
      variancePercent: week.variancePercent,
      amazonInvoiceId: week.amazonInvoiceId,
      notes: week.notes,
      status: week.status,
      createdAt: week.createdAt,
      updatedAt: week.updatedAt,
      accuracy: calculateAccuracy(toNumber(week.projectedTotal), toNumberOrNull(week.actualTotal)),
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get forecast week:", error);
    return { success: false, error: "Failed to load forecast week" };
  }
}

// ============================================
// GET WEEKLY VARIANCE
// ============================================

export async function getWeeklyVariance(
  weekStart: Date
): Promise<ActionResponse<WeeklyVariance | null>> {
  try {
    const session = await requireAuth();

    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    const week = await prisma.forecastWeek.findFirst({
      where: {
        userId: session.user.id,
        weekStart,
      },
    });

    if (!week) {
      return { success: true, data: null };
    }

    // Get trips for this week with invoice data
    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
        scheduledDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    // Build variance breakdown
    const projectedTourPay = toNumber(week.projectedTourPay);
    const projectedAccessorials = toNumber(week.projectedAccessorials);
    const projectedTotal = toNumber(week.projectedTotal);

    const actualTourPay = toNumberOrNull(week.actualTourPay);
    const actualAccessorials = toNumberOrNull(week.actualAccessorials);
    const actualAdjustments = toNumberOrNull(week.actualAdjustments);
    const actualTotal = toNumberOrNull(week.actualTotal);

    const breakdown: VarianceBreakdown[] = [
      {
        component: "Tour Pay",
        forecast: projectedTourPay,
        actual: actualTourPay ?? 0,
        variance: actualTourPay !== null ? actualTourPay - projectedTourPay : 0,
        variancePercent: calculateVariancePercent(projectedTourPay, actualTourPay),
      },
      {
        component: "Accessorials",
        forecast: projectedAccessorials,
        actual: actualAccessorials ?? 0,
        variance: actualAccessorials !== null ? actualAccessorials - projectedAccessorials : 0,
        variancePercent: calculateVariancePercent(projectedAccessorials, actualAccessorials),
      },
      {
        component: "Adjustments",
        forecast: 0,
        actual: actualAdjustments ?? 0,
        variance: actualAdjustments ?? 0,
        variancePercent: null, // Can't calculate variance percent when forecast is 0
      },
      {
        component: "TOTAL",
        forecast: projectedTotal,
        actual: actualTotal ?? 0,
        variance: actualTotal !== null ? actualTotal - projectedTotal : 0,
        variancePercent: calculateVariancePercent(projectedTotal, actualTotal),
      },
    ];

    // Build trip variances
    const tripVariances: TripVariance[] = trips.map((trip) => {
      const projectedPay = toNumber(trip.projectedRevenue);
      const actualPay = toNumberOrNull(trip.actualRevenue);

      let status = "Pending";
      if (trip.tripStage === "CANCELED") {
        status = "Canceled";
      } else if (trip.actualLoads !== null) {
        status = "Updated";
      } else if (trip.scheduledDate < new Date()) {
        status = "Pending";
      } else {
        status = "Scheduled";
      }

      return {
        tripId: trip.tripId,
        tripDbId: trip.id,
        projectedLoads: trip.projectedLoads,
        actualLoads: trip.actualLoads,
        projectedPay,
        actualPay,
        variance: actualPay !== null ? actualPay - projectedPay : null,
        status,
      };
    });

    const result: WeeklyVariance = {
      week: {
        id: week.id,
        userId: week.userId,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        weekNumber: week.weekNumber,
        year: week.year,
        truckCount: week.truckCount,
        nightsCount: week.nightsCount,
        projectedTours: week.projectedTours,
        projectedLoads: week.projectedLoads,
        projectedTourPay: toNumber(week.projectedTourPay),
        projectedAccessorials: toNumber(week.projectedAccessorials),
        projectedTotal: toNumber(week.projectedTotal),
        actualTours: week.actualTours,
        actualLoads: week.actualLoads,
        actualTourPay: toNumberOrNull(week.actualTourPay),
        actualAccessorials: toNumberOrNull(week.actualAccessorials),
        actualAdjustments: toNumberOrNull(week.actualAdjustments),
        actualTotal: toNumberOrNull(week.actualTotal),
        variance: toNumberOrNull(week.variance),
        variancePercent: week.variancePercent,
        amazonInvoiceId: week.amazonInvoiceId,
        notes: week.notes,
        status: week.status,
        createdAt: week.createdAt,
        updatedAt: week.updatedAt,
      },
      breakdown,
      tripVariances,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get weekly variance:", error);
    return { success: false, error: "Failed to load variance data" };
  }
}

// ============================================
// UPDATE FORECAST WEEK NOTES
// ============================================

export async function updateForecastWeekNotes(
  id: string,
  notes: string | null
): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();

    const week = await prisma.forecastWeek.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!week) {
      return { success: false, error: "Week not found" };
    }

    await prisma.forecastWeek.update({
      where: { id },
      data: { notes },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to update notes:", error);
    return { success: false, error: "Failed to update notes" };
  }
}

// ============================================
// GET AVAILABLE WEEKS (for week selector)
// ============================================

export async function getAvailableWeeks(): Promise<
  ActionResponse<Array<{ weekStart: Date; weekEnd: Date; label: string; hasData: boolean }>>
> {
  try {
    const session = await requireAuth();

    // Get last 12 weeks
    const weeks: Array<{ weekStart: Date; weekEnd: Date; label: string; hasData: boolean }> = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = subWeeks(now, i);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

      weeks.push({
        weekStart,
        weekEnd,
        label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
        hasData: false,
      });
    }

    // Check which weeks have data
    const forecastWeeks = await prisma.forecastWeek.findMany({
      where: {
        userId: session.user.id,
        weekStart: { gte: weeks[weeks.length - 1].weekStart },
      },
      select: { weekStart: true },
    });

    const weekStartSet = new Set(forecastWeeks.map((w) => w.weekStart.getTime()));

    for (const week of weeks) {
      week.hasData = weekStartSet.has(week.weekStart.getTime());
    }

    return { success: true, data: weeks };
  } catch (error) {
    console.error("Failed to get available weeks:", error);
    return { success: false, error: "Failed to load weeks" };
  }
}

// ============================================
// TYPES FOR AGGREGATED VARIANCE
// ============================================

export interface ForecastDateRange {
  hasData: boolean;
  minDate: Date | null;
  maxDate: Date | null;
}

export interface AggregatedVariance {
  period: {
    startDate: Date | null;
    endDate: Date | null;
    weekCount: number;
  };
  summary: {
    projectedTotal: number;
    actualTotal: number | null;
    variance: number | null;
    variancePercent: number | null;
  };
  breakdown: VarianceBreakdown[];
  tripVariances: TripVariance[];
  weeklyBreakdown: Array<{
    weekStart: Date;
    weekEnd: Date;
    projectedTotal: number;
    actualTotal: number | null;
    variance: number | null;
    variancePercent: number | null;
  }>;
}

// ============================================
// GET FORECAST DATE RANGE
// ============================================

export async function getForecastDateRange(): Promise<ActionResponse<ForecastDateRange>> {
  try {
    const session = await requireAuth();

    const result = await prisma.forecastWeek.aggregate({
      where: { userId: session.user.id },
      _min: { weekStart: true },
      _max: { weekEnd: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        hasData: result._count.id > 0,
        minDate: result._min.weekStart,
        maxDate: result._max.weekEnd,
      },
    };
  } catch (error) {
    console.error("Failed to get forecast date range:", error);
    return { success: false, error: "Failed to get forecast date range" };
  }
}

// ============================================
// GET AGGREGATED VARIANCE (with optional date filter)
// ============================================

export async function getAggregatedVariance(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResponse<AggregatedVariance | null>> {
  try {
    const session = await requireAuth();

    // Build where clause for forecast weeks
    const whereWeeks = {
      userId: session.user.id,
      ...(startDate && endDate
        ? {
            weekStart: { gte: startDate },
            weekEnd: { lte: endDate },
          }
        : {}),
    };

    // Get all forecast weeks in range
    const weeks = await prisma.forecastWeek.findMany({
      where: whereWeeks,
      orderBy: { weekStart: "desc" },
    });

    if (weeks.length === 0) {
      return { success: true, data: null };
    }

    // Build where clause for trips
    const minWeekStart = weeks.reduce(
      (min, w) => (w.weekStart < min ? w.weekStart : min),
      weeks[0].weekStart
    );
    const maxWeekEnd = weeks.reduce(
      (max, w) => (w.weekEnd > max ? w.weekEnd : max),
      weeks[0].weekEnd
    );

    const whereTrips = {
      userId: session.user.id,
      scheduledDate: {
        gte: minWeekStart,
        lte: maxWeekEnd,
      },
    };

    // Get all trips in range
    const trips = await prisma.trip.findMany({
      where: whereTrips,
      orderBy: { scheduledDate: "desc" },
    });

    // Aggregate totals
    let totalProjectedTourPay = 0;
    let totalProjectedAccessorials = 0;
    let totalProjectedTotal = 0;
    let totalActualTourPay = 0;
    let totalActualAccessorials = 0;
    let totalActualAdjustments = 0;
    let totalActualTotal = 0;
    let hasActualData = false;

    for (const week of weeks) {
      totalProjectedTourPay += toNumber(week.projectedTourPay);
      totalProjectedAccessorials += toNumber(week.projectedAccessorials);
      totalProjectedTotal += toNumber(week.projectedTotal);

      if (week.actualTotal !== null) {
        hasActualData = true;
        totalActualTourPay += toNumber(week.actualTourPay);
        totalActualAccessorials += toNumber(week.actualAccessorials);
        totalActualAdjustments += toNumber(week.actualAdjustments);
        totalActualTotal += toNumber(week.actualTotal);
      }
    }

    // Build breakdown
    const breakdown: VarianceBreakdown[] = [
      {
        component: "Tour Pay",
        forecast: totalProjectedTourPay,
        actual: hasActualData ? totalActualTourPay : 0,
        variance: hasActualData ? totalActualTourPay - totalProjectedTourPay : 0,
        variancePercent: hasActualData
          ? calculateVariancePercent(totalProjectedTourPay, totalActualTourPay)
          : null,
      },
      {
        component: "Accessorials",
        forecast: totalProjectedAccessorials,
        actual: hasActualData ? totalActualAccessorials : 0,
        variance: hasActualData ? totalActualAccessorials - totalProjectedAccessorials : 0,
        variancePercent: hasActualData
          ? calculateVariancePercent(totalProjectedAccessorials, totalActualAccessorials)
          : null,
      },
      {
        component: "Adjustments",
        forecast: 0,
        actual: hasActualData ? totalActualAdjustments : 0,
        variance: hasActualData ? totalActualAdjustments : 0,
        variancePercent: null,
      },
      {
        component: "TOTAL",
        forecast: totalProjectedTotal,
        actual: hasActualData ? totalActualTotal : 0,
        variance: hasActualData ? totalActualTotal - totalProjectedTotal : 0,
        variancePercent: hasActualData
          ? calculateVariancePercent(totalProjectedTotal, totalActualTotal)
          : null,
      },
    ];

    // Build trip variances
    const tripVariances: TripVariance[] = trips.map((trip) => {
      const projectedPay = toNumber(trip.projectedRevenue);
      const actualPay = toNumberOrNull(trip.actualRevenue);

      let status = "Pending";
      if (trip.tripStage === "CANCELED") {
        status = "Canceled";
      } else if (trip.actualLoads !== null) {
        status = "Updated";
      } else if (trip.scheduledDate < new Date()) {
        status = "Pending";
      } else {
        status = "Scheduled";
      }

      return {
        tripId: trip.tripId,
        tripDbId: trip.id,
        projectedLoads: trip.projectedLoads,
        actualLoads: trip.actualLoads,
        projectedPay,
        actualPay,
        variance: actualPay !== null ? actualPay - projectedPay : null,
        status,
      };
    });

    // Build weekly breakdown
    const weeklyBreakdown = weeks.map((week) => {
      const projectedTotal = toNumber(week.projectedTotal);
      const actualTotal = toNumberOrNull(week.actualTotal);

      return {
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        projectedTotal,
        actualTotal,
        variance: actualTotal !== null ? actualTotal - projectedTotal : null,
        variancePercent: calculateVariancePercent(projectedTotal, actualTotal),
      };
    });

    const result: AggregatedVariance = {
      period: {
        startDate: minWeekStart,
        endDate: maxWeekEnd,
        weekCount: weeks.length,
      },
      summary: {
        projectedTotal: totalProjectedTotal,
        actualTotal: hasActualData ? totalActualTotal : null,
        variance: hasActualData ? totalActualTotal - totalProjectedTotal : null,
        variancePercent: hasActualData
          ? calculateVariancePercent(totalProjectedTotal, totalActualTotal)
          : null,
      },
      breakdown,
      tripVariances,
      weeklyBreakdown,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get aggregated variance:", error);
    return { success: false, error: "Failed to load variance data" };
  }
}
