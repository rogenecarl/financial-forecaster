"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  format,
  getQuarter,
  getYear,
} from "date-fns";

// ============================================
// TYPES
// ============================================

export interface YearlySummary {
  year: number;
  totalProjected: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  accuracy: number;
  batchesCompleted: number;
  batchesTotal: number;
  tripsCompleted: number;
  loadsDelivered: number;
  canceledTrips: number;
  averageBatchRevenue: number;
  averageWeeklyProfit: number;
}

export interface MonthlyBreakdown {
  month: number;
  monthLabel: string;
  projected: number;
  actual: number;
  variance: number;
  accuracy: number;
  tripCount: number;
  loadCount: number;
  batchCount: number;
}

export interface QuarterlySummary {
  quarter: number;
  quarterLabel: string;
  year: number;
  projected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  accuracy: number;
  batchCount: number;
  tripCount: number;
}

export interface AccuracyTrendPoint {
  batchId: string;
  batchName: string;
  projected: number;
  actual: number;
  accuracy: number;
  variance: number;
  createdAt: Date;
}

export interface TopPerformingBatch {
  id: string;
  name: string;
  createdAt: Date;
  actual: number;
  projected: number;
  tripCount: number;
  loadCount: number;
  accuracy: number;
}

export interface HistoricalComparison {
  currentPeriod: {
    year: number;
    month?: number;
    quarter?: number;
    projected: number;
    actual: number;
    tripCount: number;
    loadCount: number;
    profit: number;
  };
  previousPeriod: {
    year: number;
    month?: number;
    quarter?: number;
    projected: number;
    actual: number;
    tripCount: number;
    loadCount: number;
    profit: number;
  };
  growth: {
    revenue: number;
    revenuePercent: number;
    trips: number;
    tripsPercent: number;
    loads: number;
    loadsPercent: number;
    profit: number;
    profitPercent: number;
  };
}

export interface AnalyticsData {
  yearlySummary: YearlySummary;
  monthlyBreakdown: MonthlyBreakdown[];
  quarterlySummary: QuarterlySummary[];
  accuracyTrend: AccuracyTrendPoint[];
  topPerformingBatches: TopPerformingBatch[];
  availableYears: number[];
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

function calculateAccuracy(projected: number, actual: number): number {
  if (projected === 0) return actual === 0 ? 100 : 0;
  const varianceAbs = Math.abs(actual - projected);
  return Math.max(0, (1 - varianceAbs / projected) * 100);
}

// ============================================
// GET AVAILABLE YEARS
// ============================================

export async function getAvailableYears(): Promise<ActionResponse<number[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get distinct years from trip batches (based on createdAt)
    const batches = await prisma.tripBatch.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const yearsSet = new Set<number>();
    for (const batch of batches) {
      yearsSet.add(getYear(batch.createdAt));
    }

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    // If no data, return current year
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }

    return { success: true, data: years };
  } catch (error) {
    console.error("Failed to get available years:", error);
    return { success: false, error: "Failed to load available years" };
  }
}

// ============================================
// GET YEARLY SUMMARY
// ============================================

export async function getYearlySummary(
  year: number
): Promise<ActionResponse<YearlySummary>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const now = new Date();
    const effectiveEnd = yearEnd > now ? now : yearEnd;

    // Get all trip batches for the year
    const batches = await prisma.tripBatch.findMany({
      where: {
        userId,
        createdAt: {
          gte: yearStart,
          lte: effectiveEnd,
        },
      },
      include: {
        trips: true,
      },
    });

    // Get transactions for profit calculation
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        postingDate: {
          gte: yearStart,
          lte: effectiveEnd,
        },
      },
      include: { category: true },
    });

    // Calculate totals from batches
    let totalProjected = 0;
    let totalActual = 0;
    let batchesCompleted = 0;
    let tripsCompleted = 0;
    let loadsDelivered = 0;
    let canceledTrips = 0;

    for (const batch of batches) {
      totalProjected += toNumber(batch.projectedTotal);
      if (batch.actualTotal !== null) {
        totalActual += toNumber(batch.actualTotal);
        batchesCompleted++;
      }

      // Trip stats
      for (const trip of batch.trips) {
        if (trip.tripStage === "COMPLETED" || trip.actualLoads !== null) {
          tripsCompleted++;
        }
        loadsDelivered += trip.actualLoads || 0;
        if (trip.tripStage === "CANCELED") {
          canceledTrips++;
        }
      }
    }

    const variance = totalActual - totalProjected;
    const variancePercent = totalProjected > 0 ? (variance / totalProjected) * 100 : 0;
    const accuracy = calculateAccuracy(totalProjected, totalActual);

    // Calculate average batch revenue from completed batches
    const averageBatchRevenue = batchesCompleted > 0 ? totalActual / batchesCompleted : 0;

    // Calculate total profit from transactions
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const txn of transactions) {
      const amount = toNumber(txn.amount);
      const type = txn.category?.type;
      if (type === "REVENUE" || type === "CONTRA_REVENUE") {
        totalRevenue += amount;
      } else if (type === "COGS" || type === "OPERATING_EXPENSE") {
        totalExpenses += Math.abs(amount);
      }
    }
    const totalProfit = totalRevenue - totalExpenses;
    const averageWeeklyProfit = batchesCompleted > 0 ? totalProfit / batchesCompleted : 0;

    return {
      success: true,
      data: {
        year,
        totalProjected,
        totalActual,
        variance,
        variancePercent,
        accuracy,
        batchesCompleted,
        batchesTotal: batches.length,
        tripsCompleted,
        loadsDelivered,
        canceledTrips,
        averageBatchRevenue,
        averageWeeklyProfit,
      },
    };
  } catch (error) {
    console.error("Failed to get yearly summary:", error);
    return { success: false, error: "Failed to load yearly summary" };
  }
}

// ============================================
// GET MONTHLY BREAKDOWN
// ============================================

export async function getMonthlyBreakdown(
  year: number
): Promise<ActionResponse<MonthlyBreakdown[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const months: MonthlyBreakdown[] = [];

    // Iterate through each month
    const monthsToProcess = year === currentYear ? currentMonth + 1 : 12;

    for (let month = 0; month < monthsToProcess; month++) {
      const monthStart = startOfMonth(new Date(year, month, 1));
      const monthEnd = endOfMonth(new Date(year, month, 1));

      // Get batches created in this month
      const batches = await prisma.tripBatch.findMany({
        where: {
          userId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          trips: true,
        },
      });

      let projected = 0;
      let actual = 0;
      let tripCount = 0;
      let loadCount = 0;

      for (const batch of batches) {
        projected += toNumber(batch.projectedTotal);
        if (batch.actualTotal !== null) {
          actual += toNumber(batch.actualTotal);
        }
        tripCount += batch.tripCount;
        loadCount += batch.trips.reduce((sum, t) => sum + (t.actualLoads || t.projectedLoads), 0);
      }

      const variance = actual - projected;
      const accuracy = calculateAccuracy(projected, actual);

      months.push({
        month: month + 1,
        monthLabel: format(new Date(year, month, 1), "MMM"),
        projected,
        actual,
        variance,
        accuracy,
        tripCount,
        loadCount,
        batchCount: batches.length,
      });
    }

    return { success: true, data: months };
  } catch (error) {
    console.error("Failed to get monthly breakdown:", error);
    return { success: false, error: "Failed to load monthly breakdown" };
  }
}

// ============================================
// GET QUARTERLY SUMMARY
// ============================================

export async function getQuarterlySummary(
  year: number
): Promise<ActionResponse<QuarterlySummary[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = getQuarter(now);
    const quarters: QuarterlySummary[] = [];

    // Iterate through each quarter
    const quartersToProcess = year === currentYear ? currentQuarter : 4;

    for (let q = 1; q <= quartersToProcess; q++) {
      const quarterDate = new Date(year, (q - 1) * 3, 1);
      const quarterStart = startOfQuarter(quarterDate);
      const quarterEnd = endOfQuarter(quarterDate);

      // Get batches created in this quarter
      const batches = await prisma.tripBatch.findMany({
        where: {
          userId,
          createdAt: {
            gte: quarterStart,
            lte: quarterEnd,
          },
        },
      });

      let projected = 0;
      let actual = 0;
      let tripCount = 0;

      for (const batch of batches) {
        projected += toNumber(batch.projectedTotal);
        if (batch.actualTotal !== null) {
          actual += toNumber(batch.actualTotal);
        }
        tripCount += batch.tripCount;
      }

      const variance = actual - projected;
      const variancePercent = projected > 0 ? (variance / projected) * 100 : 0;
      const accuracy = calculateAccuracy(projected, actual);

      quarters.push({
        quarter: q,
        quarterLabel: `Q${q}`,
        year,
        projected,
        actual,
        variance,
        variancePercent,
        accuracy,
        batchCount: batches.length,
        tripCount,
      });
    }

    return { success: true, data: quarters };
  } catch (error) {
    console.error("Failed to get quarterly summary:", error);
    return { success: false, error: "Failed to load quarterly summary" };
  }
}

// ============================================
// GET ACCURACY TREND
// ============================================

export async function getAccuracyTrend(
  lastNBatches: number = 12
): Promise<ActionResponse<AccuracyTrendPoint[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get the last N invoiced batches
    const batches = await prisma.tripBatch.findMany({
      where: {
        userId,
        status: "INVOICED",
        actualTotal: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: lastNBatches,
    });

    const points: AccuracyTrendPoint[] = batches.reverse().map((batch) => {
      const projected = toNumber(batch.projectedTotal);
      const actual = toNumber(batch.actualTotal);
      const variance = actual - projected;
      const accuracy = calculateAccuracy(projected, actual);

      return {
        batchId: batch.id,
        batchName: batch.name,
        projected,
        actual,
        accuracy,
        variance,
        createdAt: batch.createdAt,
      };
    });

    return { success: true, data: points };
  } catch (error) {
    console.error("Failed to get accuracy trend:", error);
    return { success: false, error: "Failed to load accuracy trend" };
  }
}

// ============================================
// GET TOP PERFORMING BATCHES
// ============================================

export async function getTopPerformingBatches(
  year: number,
  limit: number = 5
): Promise<ActionResponse<TopPerformingBatch[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Get all invoiced batches for the year with highest actual revenue
    const batches = await prisma.tripBatch.findMany({
      where: {
        userId,
        status: "INVOICED",
        actualTotal: { not: null },
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      orderBy: { actualTotal: "desc" },
      take: limit,
    });

    const topBatches: TopPerformingBatch[] = batches.map((batch) => {
      const projected = toNumber(batch.projectedTotal);
      const actual = toNumber(batch.actualTotal);
      const accuracy = calculateAccuracy(projected, actual);

      return {
        id: batch.id,
        name: batch.name,
        createdAt: batch.createdAt,
        actual,
        projected,
        tripCount: batch.tripCount,
        loadCount: batch.loadCount,
        accuracy,
      };
    });

    return { success: true, data: topBatches };
  } catch (error) {
    console.error("Failed to get top performing batches:", error);
    return { success: false, error: "Failed to load top performing batches" };
  }
}

// ============================================
// GET HISTORICAL COMPARISON (YEAR OVER YEAR)
// ============================================

export async function getHistoricalComparison(
  currentYear: number,
  month?: number,
  quarter?: number
): Promise<ActionResponse<HistoricalComparison | null>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const previousYear = currentYear - 1;

    // Helper to get period data
    async function getPeriodData(year: number) {
      let periodStart: Date;
      let periodEnd: Date;

      if (month) {
        periodStart = startOfMonth(new Date(year, month - 1, 1));
        periodEnd = endOfMonth(new Date(year, month - 1, 1));
      } else if (quarter) {
        const quarterDate = new Date(year, (quarter - 1) * 3, 1);
        periodStart = startOfQuarter(quarterDate);
        periodEnd = endOfQuarter(quarterDate);
      } else {
        // Full year
        periodStart = startOfYear(new Date(year, 0, 1));
        periodEnd = endOfYear(new Date(year, 0, 1));
      }

      // Get batches
      const batches = await prisma.tripBatch.findMany({
        where: {
          userId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });

      // Get transactions for profit
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          postingDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        include: { category: true },
      });

      let projected = 0;
      let actual = 0;
      let tripCount = 0;
      let loadCount = 0;

      for (const batch of batches) {
        projected += toNumber(batch.projectedTotal);
        if (batch.actualTotal !== null) {
          actual += toNumber(batch.actualTotal);
        }
        tripCount += batch.tripCount;
        loadCount += batch.loadCount;
      }

      // Calculate profit
      let revenue = 0;
      let expenses = 0;
      for (const txn of transactions) {
        const amount = toNumber(txn.amount);
        const type = txn.category?.type;
        if (type === "REVENUE" || type === "CONTRA_REVENUE") {
          revenue += amount;
        } else if (type === "COGS" || type === "OPERATING_EXPENSE") {
          expenses += Math.abs(amount);
        }
      }
      const profit = revenue - expenses;

      return {
        year,
        month,
        quarter,
        projected,
        actual,
        tripCount,
        loadCount,
        profit,
      };
    }

    const currentData = await getPeriodData(currentYear);
    const previousData = await getPeriodData(previousYear);

    // Check if we have any data for either period
    if (currentData.actual === 0 && previousData.actual === 0) {
      return { success: true, data: null };
    }

    // Calculate growth
    const revenueGrowth = currentData.actual - previousData.actual;
    const revenueGrowthPercent = previousData.actual > 0
      ? (revenueGrowth / previousData.actual) * 100
      : currentData.actual > 0 ? 100 : 0;

    const tripsGrowth = currentData.tripCount - previousData.tripCount;
    const tripsGrowthPercent = previousData.tripCount > 0
      ? (tripsGrowth / previousData.tripCount) * 100
      : currentData.tripCount > 0 ? 100 : 0;

    const loadsGrowth = currentData.loadCount - previousData.loadCount;
    const loadsGrowthPercent = previousData.loadCount > 0
      ? (loadsGrowth / previousData.loadCount) * 100
      : currentData.loadCount > 0 ? 100 : 0;

    const profitGrowth = currentData.profit - previousData.profit;
    const profitGrowthPercent = previousData.profit !== 0
      ? (profitGrowth / Math.abs(previousData.profit)) * 100
      : currentData.profit !== 0 ? 100 : 0;

    return {
      success: true,
      data: {
        currentPeriod: currentData,
        previousPeriod: previousData,
        growth: {
          revenue: revenueGrowth,
          revenuePercent: revenueGrowthPercent,
          trips: tripsGrowth,
          tripsPercent: tripsGrowthPercent,
          loads: loadsGrowth,
          loadsPercent: loadsGrowthPercent,
          profit: profitGrowth,
          profitPercent: profitGrowthPercent,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get historical comparison:", error);
    return { success: false, error: "Failed to load historical comparison" };
  }
}

// ============================================
// GET ALL ANALYTICS DATA (COMBINED)
// ============================================

export async function getAnalyticsData(
  year: number
): Promise<ActionResponse<AnalyticsData>> {
  try {
    const [
      yearlySummaryResult,
      monthlyBreakdownResult,
      quarterlySummaryResult,
      accuracyTrendResult,
      topBatchesResult,
      availableYearsResult,
    ] = await Promise.all([
      getYearlySummary(year),
      getMonthlyBreakdown(year),
      getQuarterlySummary(year),
      getAccuracyTrend(12),
      getTopPerformingBatches(year, 5),
      getAvailableYears(),
    ]);

    if (!yearlySummaryResult.success) {
      return { success: false, error: yearlySummaryResult.error };
    }

    return {
      success: true,
      data: {
        yearlySummary: yearlySummaryResult.data,
        monthlyBreakdown: monthlyBreakdownResult.success ? monthlyBreakdownResult.data : [],
        quarterlySummary: quarterlySummaryResult.success ? quarterlySummaryResult.data : [],
        accuracyTrend: accuracyTrendResult.success ? accuracyTrendResult.data : [],
        topPerformingBatches: topBatchesResult.success ? topBatchesResult.data : [],
        availableYears: availableYearsResult.success ? availableYearsResult.data : [year],
      },
    };
  } catch (error) {
    console.error("Failed to get analytics data:", error);
    return { success: false, error: "Failed to load analytics" };
  }
}
