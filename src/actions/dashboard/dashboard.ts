"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import { startOfWeek, endOfWeek, subWeeks, addWeeks, format, startOfYear, getWeek } from "date-fns";
import { calculateForecast } from "@/lib/forecast-calculations";

// ============================================
// TYPES
// ============================================

export interface DashboardMetrics {
  cashOnHand: number;
  weeklyRevenue: number;
  weeklyProfit: number;
  contributionMargin: number;
  truckCount: number;
  revenueChange: number | null;
  profitChange: number | null;
}

export interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  postingDate: Date;
  categoryName: string | null;
  categoryColor: string | null;
  categoryType: string | null;
}

export interface ThisWeekForecast {
  weekStart: Date;
  weekEnd: Date;
  projectedTotal: number;
  currentTotal: number;
  progressPercent: number;
  tripsCompleted: number;
  tripsTotal: number;
  loadsDelivered: number;
  loadsTotal: number;
}

export interface ForecastVsActualWeek {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  forecast: number;
  actual: number | null;
  variance: number | null;
  accuracy: number | null;
}

export interface CashFlowDataPoint {
  week: string;
  weekStart: Date;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface NextWeekForecast {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  projectedTotal: number;
  hasTrips: boolean;
  tripCount: number;
}

export interface ModelAccuracy {
  accuracy: number;
  weekCount: number;
}

export interface YearToDateData {
  year: number;
  totalRevenue: number;
  totalProjected: number;
  accuracy: number;
  tripsCompleted: number;
  loadsDelivered: number;
  canceledCount: number;
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
// GET DASHBOARD METRICS
// ============================================

export async function getDashboardMetrics(): Promise<ActionResponse<DashboardMetrics>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const previousWeekStart = subWeeks(currentWeekStart, 1);
    const previousWeekEnd = subWeeks(currentWeekEnd, 1);

    // Get cash on hand (latest balance from transactions)
    const latestTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { postingDate: "desc" },
      select: { balance: true },
    });
    const cashOnHand = toNumber(latestTransaction?.balance);

    // Get this week's transactions for revenue/expenses
    const thisWeekTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        postingDate: {
          gte: currentWeekStart,
          lte: currentWeekEnd,
        },
      },
      include: { category: true },
    });

    // Get previous week's transactions for comparison
    const prevWeekTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        postingDate: {
          gte: previousWeekStart,
          lte: previousWeekEnd,
        },
      },
      include: { category: true },
    });

    // Calculate weekly revenue and profit using multi-tier P&L categories
    // REVENUE and CONTRA_REVENUE count towards revenue
    // COGS and OPERATING_EXPENSE count towards expenses
    // EQUITY and UNCATEGORIZED are excluded from P&L
    let weeklyRevenue = 0;
    let weeklyExpenses = 0;
    for (const txn of thisWeekTransactions) {
      const amount = toNumber(txn.amount);
      const type = txn.category?.type;
      if (type === "REVENUE") {
        weeklyRevenue += amount;
      } else if (type === "CONTRA_REVENUE") {
        weeklyRevenue += amount; // Contra-revenue adds (refunds are positive)
      } else if (type === "COGS" || type === "OPERATING_EXPENSE") {
        weeklyExpenses += Math.abs(amount);
      }
    }
    const weeklyProfit = weeklyRevenue - weeklyExpenses;

    // Calculate previous week for comparison
    let prevRevenue = 0;
    let prevExpenses = 0;
    for (const txn of prevWeekTransactions) {
      const amount = toNumber(txn.amount);
      const type = txn.category?.type;
      if (type === "REVENUE") {
        prevRevenue += amount;
      } else if (type === "CONTRA_REVENUE") {
        prevRevenue += amount;
      } else if (type === "COGS" || type === "OPERATING_EXPENSE") {
        prevExpenses += Math.abs(amount);
      }
    }
    const prevProfit = prevRevenue - prevExpenses;

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0
      ? ((weeklyRevenue - prevRevenue) / prevRevenue) * 100
      : null;
    const profitChange = prevProfit !== 0
      ? ((weeklyProfit - prevProfit) / Math.abs(prevProfit)) * 100
      : null;

    // Get truck count from default forecast
    const defaultForecast = await prisma.forecast.findFirst({
      where: { userId, isDefault: true },
      select: { truckCount: true },
    });

    const truckCount = defaultForecast?.truckCount || 2;

    // Calculate contribution margin using forecast calculations
    const forecastResult = calculateForecast({
      truckCount,
      nightsPerWeek: 7,
      toursPerTruck: 1,
      avgLoadsPerTour: 4,
      dtrRate: 452.09,
      avgAccessorialRate: 34.12,
      hourlyWage: 20,
      hoursPerNight: 10,
      includeOvertime: true,
      overtimeMultiplier: 1.5,
      payrollTaxRate: 0.0765,
      workersCompRate: 0.05,
      weeklyOverhead: 0,
    });

    return {
      success: true,
      data: {
        cashOnHand,
        weeklyRevenue,
        weeklyProfit,
        contributionMargin: forecastResult.contributionMargin,
        truckCount,
        revenueChange,
        profitChange,
      },
    };
  } catch (error) {
    console.error("Failed to get dashboard metrics:", error);
    return { success: false, error: "Failed to load dashboard metrics" };
  }
}

// ============================================
// GET RECENT TRANSACTIONS
// ============================================

export async function getRecentTransactions(
  limit: number = 5
): Promise<ActionResponse<RecentTransaction[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { postingDate: "desc" },
      take: limit,
    });

    const result: RecentTransaction[] = transactions.map((txn) => ({
      id: txn.id,
      description: txn.description,
      amount: toNumber(txn.amount),
      postingDate: txn.postingDate,
      categoryName: txn.category?.name || null,
      categoryColor: txn.category?.color || null,
      categoryType: txn.category?.type || null,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get recent transactions:", error);
    return { success: false, error: "Failed to load recent transactions" };
  }
}

// ============================================
// GET THIS WEEK'S FORECAST
// ============================================

export async function getThisWeekForecast(): Promise<ActionResponse<ThisWeekForecast | null>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Get trips for this week (across all batches)
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Calculate totals
    const tripsTotal = trips.length;
    const tripsCompleted = trips.filter(
      (t) => t.tripStage === "COMPLETED" || t.actualLoads !== null
    ).length;

    const loadsTotal = trips.reduce((sum, t) => sum + t.projectedLoads, 0);
    const loadsDelivered = trips.reduce((sum, t) => sum + (t.actualLoads || 0), 0);

    // Calculate from trips
    const projectedTotal = trips.reduce((sum, t) => sum + toNumber(t.projectedRevenue), 0);

    // Sum actual revenue from trips with actual loads
    const currentTotal = trips.reduce((sum, t) => sum + toNumber(t.actualRevenue), 0);

    const progressPercent =
      projectedTotal > 0 ? Math.min(100, (currentTotal / projectedTotal) * 100) : 0;

    return {
      success: true,
      data: {
        weekStart,
        weekEnd,
        projectedTotal,
        currentTotal,
        progressPercent: Math.round(progressPercent),
        tripsCompleted,
        tripsTotal,
        loadsDelivered,
        loadsTotal,
      },
    };
  } catch (error) {
    console.error("Failed to get this week's forecast:", error);
    return { success: false, error: "Failed to load forecast" };
  }
}

// ============================================
// GET FORECAST VS ACTUAL (LAST 4 WEEKS)
// ============================================

export async function getForecastVsActual(
  weekCount: number = 4
): Promise<ActionResponse<ForecastVsActualWeek[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const weeks: ForecastVsActualWeek[] = [];

    for (let i = 1; i <= weekCount; i++) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
      const weekLabel = `${format(weekStart, "MMM d")}-${format(weekEnd, "d")}`;

      // Get trips for this week (across all batches)
      const trips = await prisma.trip.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      if (trips.length > 0) {
        const forecast = trips.reduce(
          (sum, t) => sum + toNumber(t.projectedRevenue),
          0
        );
        const actualSum = trips
          .filter((t) => t.actualRevenue !== null)
          .reduce((sum, t) => sum + toNumber(t.actualRevenue), 0);
        const hasActual = trips.some((t) => t.actualRevenue !== null);
        const actual = hasActual ? actualSum : null;
        const variance = actual !== null ? actual - forecast : null;

        let accuracy: number | null = null;
        if (actual !== null && forecast > 0) {
          const varianceAbs = Math.abs(actual - forecast);
          accuracy = Math.max(0, Math.round((1 - varianceAbs / forecast) * 100));
        }

        weeks.push({
          weekStart,
          weekEnd,
          weekLabel,
          forecast,
          actual,
          variance,
          accuracy,
        });
      }
    }

    return { success: true, data: weeks };
  } catch (error) {
    console.error("Failed to get forecast vs actual:", error);
    return { success: false, error: "Failed to load forecast comparison" };
  }
}

// ============================================
// GET CASH FLOW TREND (8 WEEKS)
// ============================================

export async function getCashFlowTrend(
  weekCount: number = 8
): Promise<ActionResponse<CashFlowDataPoint[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const dataPoints: CashFlowDataPoint[] = [];

    for (let i = weekCount - 1; i >= 0; i--) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, "MMM d");

      // Get transactions for this week
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          postingDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: { category: true },
      });

      let revenue = 0;
      let expenses = 0;

      for (const txn of transactions) {
        const amount = toNumber(txn.amount);
        const type = txn.category?.type;
        if (type === "REVENUE") {
          revenue += amount;
        } else if (type === "CONTRA_REVENUE") {
          revenue += amount; // Contra-revenue adds (refunds are positive)
        } else if (type === "COGS" || type === "OPERATING_EXPENSE") {
          expenses += Math.abs(amount);
        }
      }

      dataPoints.push({
        week: weekLabel,
        weekStart,
        revenue,
        expenses,
        profit: revenue - expenses,
      });
    }

    return { success: true, data: dataPoints };
  } catch (error) {
    console.error("Failed to get cash flow trend:", error);
    return { success: false, error: "Failed to load cash flow data" };
  }
}

// ============================================
// GET NEXT WEEK'S FORECAST
// ============================================

export async function getNextWeekForecast(): Promise<ActionResponse<NextWeekForecast | null>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const nextWeekDate = addWeeks(now, 1);
    const weekStart = startOfWeek(nextWeekDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(nextWeekDate, { weekStartsOn: 1 });
    const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

    // Get trips for next week (across all batches)
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const hasTrips = trips.length > 0;
    const tripCount = trips.length;

    // Calculate projected total from trips
    const projectedTotal = hasTrips
      ? trips.reduce((sum, t) => sum + toNumber(t.projectedRevenue), 0)
      : 0;

    return {
      success: true,
      data: {
        weekNumber,
        weekStart,
        weekEnd,
        projectedTotal,
        hasTrips,
        tripCount,
      },
    };
  } catch (error) {
    console.error("Failed to get next week forecast:", error);
    return { success: false, error: "Failed to load next week forecast" };
  }
}

// ============================================
// GET MODEL ACCURACY (LAST N WEEKS AVERAGE)
// ============================================

export async function getModelAccuracy(
  weekCount: number = 4
): Promise<ActionResponse<ModelAccuracy>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const accuracies: number[] = [];

    for (let i = 1; i <= weekCount; i++) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

      // Get trips for this week (across all batches)
      const trips = await prisma.trip.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      const hasActualData = trips.some((t) => t.actualRevenue !== null);
      if (trips.length > 0 && hasActualData) {
        const forecast = trips.reduce((sum, t) => sum + toNumber(t.projectedRevenue), 0);
        const actual = trips
          .filter((t) => t.actualRevenue !== null)
          .reduce((sum, t) => sum + toNumber(t.actualRevenue), 0);

        if (forecast > 0) {
          const varianceAbs = Math.abs(actual - forecast);
          const weekAccuracy = Math.max(0, (1 - varianceAbs / forecast) * 100);
          accuracies.push(weekAccuracy);
        }
      }
    }

    const averageAccuracy =
      accuracies.length > 0
        ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
        : 0;

    return {
      success: true,
      data: {
        accuracy: averageAccuracy,
        weekCount: accuracies.length,
      },
    };
  } catch (error) {
    console.error("Failed to get model accuracy:", error);
    return { success: false, error: "Failed to load model accuracy" };
  }
}

// ============================================
// GET YEAR-TO-DATE DATA
// ============================================

export async function getYearToDateData(): Promise<ActionResponse<YearToDateData>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const year = now.getFullYear();
    const yearStart = startOfYear(now);

    // Get all trips for this year (across all batches)
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: yearStart,
          lte: now,
        },
      },
    });

    // Calculate totals from trips
    const totalProjected = trips.reduce((sum, t) => sum + toNumber(t.projectedRevenue), 0);
    const totalRevenue = trips
      .filter((t) => t.actualRevenue !== null)
      .reduce((sum, t) => sum + toNumber(t.actualRevenue), 0);

    // Calculate YTD accuracy
    let accuracy = 0;
    if (totalProjected > 0 && totalRevenue > 0) {
      const varianceAbs = Math.abs(totalRevenue - totalProjected);
      accuracy = Math.max(0, (1 - varianceAbs / totalProjected) * 100);
    }

    // Count completed trips
    const tripsCompleted = trips.filter(
      (t) => t.tripStage === "COMPLETED" || t.actualLoads !== null
    ).length;

    // Sum loads delivered
    const loadsDelivered = trips.reduce((sum, t) => sum + (t.actualLoads || 0), 0);

    // Count canceled trips
    const canceledCount = trips.filter((t) => t.tripStage === "CANCELED").length;

    return {
      success: true,
      data: {
        year,
        totalRevenue,
        totalProjected,
        accuracy,
        tripsCompleted,
        loadsDelivered,
        canceledCount,
      },
    };
  } catch (error) {
    console.error("Failed to get year-to-date data:", error);
    return { success: false, error: "Failed to load year-to-date data" };
  }
}

// ============================================
// GET ALL DASHBOARD DATA (COMBINED)
// ============================================

export interface DashboardData {
  metrics: DashboardMetrics;
  recentTransactions: RecentTransaction[];
  thisWeekForecast: ThisWeekForecast | null;
  forecastVsActual: ForecastVsActualWeek[];
  cashFlowTrend: CashFlowDataPoint[];
  nextWeekForecast: NextWeekForecast | null;
  modelAccuracy: ModelAccuracy | null;
  yearToDate: YearToDateData | null;
}

export async function getDashboardData(): Promise<ActionResponse<DashboardData>> {
  try {
    const [
      metricsResult,
      transactionsResult,
      forecastResult,
      comparisonResult,
      cashFlowResult,
      nextWeekResult,
      accuracyResult,
      ytdResult,
    ] = await Promise.all([
      getDashboardMetrics(),
      getRecentTransactions(5),
      getThisWeekForecast(),
      getForecastVsActual(4),
      getCashFlowTrend(8),
      getNextWeekForecast(),
      getModelAccuracy(4),
      getYearToDateData(),
    ]);

    if (!metricsResult.success) {
      return { success: false, error: metricsResult.error };
    }

    return {
      success: true,
      data: {
        metrics: metricsResult.data,
        recentTransactions: transactionsResult.success ? transactionsResult.data : [],
        thisWeekForecast: forecastResult.success ? forecastResult.data : null,
        forecastVsActual: comparisonResult.success ? comparisonResult.data : [],
        cashFlowTrend: cashFlowResult.success ? cashFlowResult.data : [],
        nextWeekForecast: nextWeekResult.success ? nextWeekResult.data : null,
        modelAccuracy: accuracyResult.success ? accuracyResult.data : null,
        yearToDate: ytdResult.success ? ytdResult.data : null,
      },
    };
  } catch (error) {
    console.error("Failed to get dashboard data:", error);
    return { success: false, error: "Failed to load dashboard" };
  }
}
