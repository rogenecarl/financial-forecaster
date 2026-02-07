"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

// ============================================
// TYPES
// ============================================

export interface DashboardMetrics {
  revenueEarned: number;
  revenueEarnedBatchCount: number;
  inPipeline: number;
  inPipelineBatchCount: number;
  uncategorizedCount: number;
  forecastAccuracy: number | null;
  forecastAccuracyBatchCount: number;
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

export interface CashFlowDataPoint {
  week: string;
  weekStart: Date;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RevenuePipelineData {
  projected: number;
  invoiced: number;
  deposited: number;
  projectedBatchCount: number;
  invoicedBatchCount: number;
  depositedBatchCount: number;
}

export interface ActiveBatchItem {
  id: string;
  name: string;
  type: "trip" | "transaction";
  status: string;
  itemCount: number;
  actionNeeded: string;
  total: number;
}

export interface PLQuickViewData {
  batchName: string;
  batchId: string;
  netRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  operatingMargin: number;
  transactionCount: number;
}

export interface VarianceSnapshotItem {
  batchId: string;
  batchName: string;
  projected: number;
  actual: number;
  variance: number;
  variancePercent: number;
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

    const [
      invoicedBatches,
      pipelineBatches,
      uncategorizedAgg,
    ] = await Promise.all([
      // Revenue Earned: all INVOICED trip batches
      prisma.tripBatch.findMany({
        where: { userId, status: "INVOICED" },
        orderBy: { updatedAt: "desc" },
        select: { projectedTotal: true, actualTotal: true },
      }),
      // In Pipeline: active trip batches (not yet invoiced, not empty)
      prisma.tripBatch.findMany({
        where: {
          userId,
          status: { in: ["UPCOMING", "IN_PROGRESS", "COMPLETED"] },
        },
        select: { projectedTotal: true },
      }),
      // Uncategorized transactions across all batches
      prisma.transactionBatch.aggregate({
        where: { userId },
        _sum: { uncategorizedCount: true },
      }),
    ]);

    // Revenue Earned
    const revenueEarned = invoicedBatches.reduce(
      (sum, b) => sum + toNumber(b.actualTotal), 0
    );

    // In Pipeline
    const inPipeline = pipelineBatches.reduce(
      (sum, b) => sum + toNumber(b.projectedTotal), 0
    );

    // Forecast Accuracy (avg across invoiced batches with actuals)
    let forecastAccuracy: number | null = null;
    const accuracyBatches = invoicedBatches
      .filter((b) => b.actualTotal !== null)
      .slice(0, 4);
    if (accuracyBatches.length > 0) {
      const accuracies = accuracyBatches.map((b) => {
        const projected = toNumber(b.projectedTotal);
        const actual = toNumber(b.actualTotal);
        if (projected > 0) {
          return Math.max(0, (1 - Math.abs(actual - projected) / projected) * 100);
        }
        return 0;
      });
      forecastAccuracy = accuracies.reduce((s, a) => s + a, 0) / accuracies.length;
    }

    return {
      success: true,
      data: {
        revenueEarned,
        revenueEarnedBatchCount: invoicedBatches.length,
        inPipeline,
        inPipelineBatchCount: pipelineBatches.length,
        uncategorizedCount: uncategorizedAgg._sum.uncategorizedCount ?? 0,
        forecastAccuracy,
        forecastAccuracyBatchCount: accuracyBatches.length,
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

    const trips = await prisma.trip.findMany({
      where: {
        userId,
        scheduledDate: { gte: weekStart, lte: weekEnd },
      },
    });

    const tripsTotal = trips.length;
    const tripsCompleted = trips.filter(
      (t) => t.tripStage === "COMPLETED" || t.actualLoads !== null
    ).length;
    const loadsTotal = trips.reduce((sum, t) => sum + t.projectedLoads, 0);
    const loadsDelivered = trips.reduce((sum, t) => sum + (t.actualLoads || 0), 0);
    const projectedTotal = trips.reduce((sum, t) => sum + toNumber(t.projectedRevenue), 0);
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

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          postingDate: { gte: weekStart, lte: weekEnd },
        },
        include: { category: true },
      });

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
// GET REVENUE PIPELINE
// ============================================

export async function getRevenuePipeline(): Promise<ActionResponse<RevenuePipelineData>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Projected: active trip batches (IN_PROGRESS, COMPLETED)
    const activeTripBatches = await prisma.tripBatch.findMany({
      where: {
        userId,
        status: { in: ["IN_PROGRESS", "COMPLETED", "UPCOMING"] },
      },
      select: { projectedTotal: true },
    });
    const projected = activeTripBatches.reduce(
      (sum, b) => sum + toNumber(b.projectedTotal), 0
    );

    // Invoiced: INVOICED trip batches
    const invoicedTripBatches = await prisma.tripBatch.findMany({
      where: { userId, status: "INVOICED" },
      select: { actualTotal: true },
    });
    const invoiced = invoicedTripBatches.reduce(
      (sum, b) => sum + toNumber(b.actualTotal), 0
    );

    // Deposited: RECONCILED transaction batches
    const reconciledTxnBatches = await prisma.transactionBatch.findMany({
      where: { userId, status: "RECONCILED" },
      select: { netRevenue: true },
    });
    const deposited = reconciledTxnBatches.reduce(
      (sum, b) => sum + toNumber(b.netRevenue), 0
    );

    return {
      success: true,
      data: {
        projected,
        invoiced,
        deposited,
        projectedBatchCount: activeTripBatches.length,
        invoicedBatchCount: invoicedTripBatches.length,
        depositedBatchCount: reconciledTxnBatches.length,
      },
    };
  } catch (error) {
    console.error("Failed to get revenue pipeline:", error);
    return { success: false, error: "Failed to load revenue pipeline" };
  }
}

// ============================================
// GET ACTIVE BATCHES (NEEDING ATTENTION)
// ============================================

export async function getActiveBatches(): Promise<ActionResponse<ActiveBatchItem[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const items: ActiveBatchItem[] = [];

    // Trip batches: IN_PROGRESS or COMPLETED (awaiting invoice)
    const tripBatches = await prisma.tripBatch.findMany({
      where: {
        userId,
        status: { in: ["IN_PROGRESS", "COMPLETED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        tripCount: true,
        projectedTotal: true,
      },
    });

    for (const batch of tripBatches) {
      items.push({
        id: batch.id,
        name: batch.name,
        type: "trip",
        status: batch.status,
        itemCount: batch.tripCount,
        actionNeeded: batch.status === "COMPLETED"
          ? "Import invoice"
          : "Update trip actuals",
        total: toNumber(batch.projectedTotal),
      });
    }

    // Transaction batches: ACTIVE with uncategorized transactions
    const txnBatches = await prisma.transactionBatch.findMany({
      where: {
        userId,
        status: "ACTIVE",
        uncategorizedCount: { gt: 0 },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        transactionCount: true,
        uncategorizedCount: true,
        netRevenue: true,
      },
    });

    for (const batch of txnBatches) {
      items.push({
        id: batch.id,
        name: batch.name,
        type: "transaction",
        status: batch.status,
        itemCount: batch.uncategorizedCount,
        actionNeeded: `${batch.uncategorizedCount} uncategorized`,
        total: toNumber(batch.netRevenue),
      });
    }

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to get active batches:", error);
    return { success: false, error: "Failed to load active batches" };
  }
}

// ============================================
// GET P&L QUICK VIEW
// ============================================

export async function getPLQuickView(): Promise<ActionResponse<PLQuickViewData | null>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const batch = await prisma.transactionBatch.findFirst({
      where: { userId, status: "RECONCILED" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        netRevenue: true,
        grossProfit: true,
        operatingIncome: true,
        operatingMargin: true,
        transactionCount: true,
      },
    });

    if (!batch) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        batchId: batch.id,
        batchName: batch.name,
        netRevenue: toNumber(batch.netRevenue),
        grossProfit: toNumber(batch.grossProfit),
        operatingIncome: toNumber(batch.operatingIncome),
        operatingMargin: batch.operatingMargin,
        transactionCount: batch.transactionCount,
      },
    };
  } catch (error) {
    console.error("Failed to get P&L quick view:", error);
    return { success: false, error: "Failed to load P&L data" };
  }
}

// ============================================
// GET VARIANCE SNAPSHOT
// ============================================

export async function getVarianceSnapshot(): Promise<ActionResponse<VarianceSnapshotItem[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const batches = await prisma.tripBatch.findMany({
      where: {
        userId,
        status: "INVOICED",
        actualTotal: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        projectedTotal: true,
        actualTotal: true,
        variance: true,
        variancePercent: true,
      },
    });

    const items: VarianceSnapshotItem[] = batches.map((b) => ({
      batchId: b.id,
      batchName: b.name,
      projected: toNumber(b.projectedTotal),
      actual: toNumber(b.actualTotal),
      variance: toNumber(b.variance),
      variancePercent: b.variancePercent ?? 0,
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to get variance snapshot:", error);
    return { success: false, error: "Failed to load variance data" };
  }
}

// ============================================
// GET ALL DASHBOARD DATA (COMBINED)
// ============================================

export interface DashboardData {
  metrics: DashboardMetrics;
  recentTransactions: RecentTransaction[];
  thisWeekForecast: ThisWeekForecast | null;
  cashFlowTrend: CashFlowDataPoint[];
  revenuePipeline: RevenuePipelineData | null;
  activeBatches: ActiveBatchItem[];
  plQuickView: PLQuickViewData | null;
  varianceSnapshot: VarianceSnapshotItem[];
}

export async function getDashboardData(): Promise<ActionResponse<DashboardData>> {
  try {
    const [
      metricsResult,
      transactionsResult,
      forecastResult,
      cashFlowResult,
      pipelineResult,
      activeBatchesResult,
      plResult,
      varianceResult,
    ] = await Promise.all([
      getDashboardMetrics(),
      getRecentTransactions(5),
      getThisWeekForecast(),
      getCashFlowTrend(8),
      getRevenuePipeline(),
      getActiveBatches(),
      getPLQuickView(),
      getVarianceSnapshot(),
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
        cashFlowTrend: cashFlowResult.success ? cashFlowResult.data : [],
        revenuePipeline: pipelineResult.success ? pipelineResult.data : null,
        activeBatches: activeBatchesResult.success ? activeBatchesResult.data : [],
        plQuickView: plResult.success ? plResult.data : null,
        varianceSnapshot: varianceResult.success ? varianceResult.data : [],
      },
    };
  } catch (error) {
    console.error("Failed to get dashboard data:", error);
    return { success: false, error: "Failed to load dashboard" };
  }
}
