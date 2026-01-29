"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  format,
  subWeeks,
  getWeek,
  getYear,
} from "date-fns";

// ============================================
// TYPES
// ============================================

export interface WeekOption {
  weekStart: Date;
  weekEnd: Date;
  label: string;
  weekNumber: number;
  year: number;
}

export interface MonthOption {
  monthStart: Date;
  monthEnd: Date;
  label: string;
  month: number;
  year: number;
}

export interface QuarterOption {
  quarterStart: Date;
  quarterEnd: Date;
  label: string;
  quarter: number;
  year: number;
}

export interface PLReportData {
  period: {
    type: "week" | "month";
    startDate: Date;
    endDate: Date;
    label: string;
  };
  companyName: string;
  generatedAt: Date;
  revenue: {
    items: Array<{
      categoryName: string;
      amount: number;
      transactionCount: number;
    }>;
    total: number;
  };
  expenses: {
    items: Array<{
      categoryName: string;
      amount: number;
      transactionCount: number;
    }>;
    total: number;
  };
  netProfit: number;
  profitMargin: number;
}

export interface TransactionExportData {
  period: {
    startDate: Date | null;
    endDate: Date | null;
  };
  transactions: Array<{
    postingDate: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    categoryType: string;
    reviewStatus: string;
  }>;
  totalCount: number;
}

export interface ForecastExportData {
  period: {
    startDate: Date | null;
    endDate: Date | null;
  };
  weeks: Array<{
    weekLabel: string;
    weekStart: Date;
    weekEnd: Date;
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
    accuracy: number | null;
  }>;
  summary: {
    totalProjected: number;
    totalActual: number | null;
    totalVariance: number | null;
    averageAccuracy: number | null;
  };
}

export interface CPAPackageData {
  quarter: QuarterOption;
  plStatement: PLReportData;
  transactions: TransactionExportData;
  forecastSummary: ForecastExportData;
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

function calculateAccuracy(forecast: number, actual: number | null): number | null {
  if (actual === null || forecast === 0) return null;
  const variance = Math.abs(actual - forecast);
  const accuracy = Math.max(0, (1 - variance / forecast) * 100);
  return Math.round(accuracy);
}

// ============================================
// GET AVAILABLE WEEKS
// ============================================

export async function getAvailableWeeksForReport(
  count: number = 12
): Promise<ActionResponse<WeekOption[]>> {
  try {
    await requireAuth();

    const weeks: WeekOption[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const date = subWeeks(now, i);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

      weeks.push({
        weekStart,
        weekEnd,
        label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
        weekNumber: getWeek(weekStart, { weekStartsOn: 1 }),
        year: getYear(weekStart),
      });
    }

    return { success: true, data: weeks };
  } catch (error) {
    console.error("Failed to get available weeks:", error);
    return { success: false, error: "Failed to load weeks" };
  }
}

// ============================================
// GET AVAILABLE MONTHS
// ============================================

export async function getAvailableMonthsForReport(
  count: number = 12
): Promise<ActionResponse<MonthOption[]>> {
  try {
    await requireAuth();

    const months: MonthOption[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      months.push({
        monthStart,
        monthEnd,
        label: format(monthStart, "MMMM yyyy"),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }

    return { success: true, data: months };
  } catch (error) {
    console.error("Failed to get available months:", error);
    return { success: false, error: "Failed to load months" };
  }
}

// ============================================
// GET AVAILABLE QUARTERS
// ============================================

export async function getAvailableQuartersForReport(
  count: number = 8
): Promise<ActionResponse<QuarterOption[]>> {
  try {
    await requireAuth();

    const quarters: QuarterOption[] = [];
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);

    for (let i = 0; i < count; i++) {
      let quarter = currentQuarter - i;
      let year = now.getFullYear();

      while (quarter < 0) {
        quarter += 4;
        year -= 1;
      }

      const quarterStart = startOfQuarter(new Date(year, quarter * 3, 1));
      const quarterEnd = endOfQuarter(quarterStart);

      quarters.push({
        quarterStart,
        quarterEnd,
        label: `Q${quarter + 1} ${year}`,
        quarter: quarter + 1,
        year,
      });
    }

    return { success: true, data: quarters };
  } catch (error) {
    console.error("Failed to get available quarters:", error);
    return { success: false, error: "Failed to load quarters" };
  }
}

// ============================================
// GET P&L REPORT DATA
// ============================================

export async function getPLReportData(
  periodType: "week" | "month",
  startDate: Date,
  endDate: Date
): Promise<ActionResponse<PLReportData>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Fetch transactions with categories
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        postingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryGroups = new Map<
      string,
      {
        categoryName: string;
        categoryType: string;
        amount: number;
        transactionCount: number;
      }
    >();

    for (const txn of transactions) {
      if (!txn.categoryId || !txn.category || !txn.category.includeInPL) {
        continue;
      }

      const key = txn.categoryId;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, {
          categoryName: txn.category.name,
          categoryType: txn.category.type,
          amount: 0,
          transactionCount: 0,
        });
      }

      const group = categoryGroups.get(key)!;
      group.amount += toNumber(txn.amount);
      group.transactionCount += 1;
    }

    // Separate revenue and expenses
    const revenueItems: PLReportData["revenue"]["items"] = [];
    const expenseItems: PLReportData["expenses"]["items"] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const [, group] of categoryGroups) {
      const item = {
        categoryName: group.categoryName,
        amount: group.amount,
        transactionCount: group.transactionCount,
      };

      if (group.categoryType === "REVENUE") {
        revenueItems.push(item);
        totalRevenue += group.amount;
      } else if (group.categoryType === "EXPENSE") {
        expenseItems.push(item);
        totalExpenses += Math.abs(group.amount);
      }
    }

    // Sort by amount
    revenueItems.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    expenseItems.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const periodLabel =
      periodType === "week"
        ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
        : format(startDate, "MMMM yyyy");

    return {
      success: true,
      data: {
        period: {
          type: periodType,
          startDate,
          endDate,
          label: periodLabel,
        },
        companyName: "Peak Transport LLC",
        generatedAt: new Date(),
        revenue: {
          items: revenueItems,
          total: totalRevenue,
        },
        expenses: {
          items: expenseItems,
          total: totalExpenses,
        },
        netProfit,
        profitMargin,
      },
    };
  } catch (error) {
    console.error("Failed to get P&L report data:", error);
    return { success: false, error: "Failed to generate P&L report" };
  }
}

// ============================================
// GET TRANSACTION EXPORT DATA
// ============================================

export async function getTransactionExportData(
  startDate?: Date,
  endDate?: Date,
  categoryIds?: string[]
): Promise<ActionResponse<TransactionExportData>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Build where clause
    const whereClause: {
      userId: string;
      postingDate?: { gte?: Date; lte?: Date };
      categoryId?: { in: string[] };
    } = { userId };

    if (startDate || endDate) {
      whereClause.postingDate = {};
      if (startDate) whereClause.postingDate.gte = startDate;
      if (endDate) whereClause.postingDate.lte = endDate;
    }

    if (categoryIds && categoryIds.length > 0) {
      whereClause.categoryId = { in: categoryIds };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: { postingDate: "desc" },
    });

    const exportData: TransactionExportData["transactions"] = transactions.map((txn) => ({
      postingDate: format(txn.postingDate, "yyyy-MM-dd"),
      description: txn.description,
      amount: toNumber(txn.amount),
      type: txn.type,
      category: txn.category?.name || "Uncategorized",
      categoryType: txn.category?.type || "UNKNOWN",
      reviewStatus: txn.reviewStatus,
    }));

    return {
      success: true,
      data: {
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        transactions: exportData,
        totalCount: exportData.length,
      },
    };
  } catch (error) {
    console.error("Failed to get transaction export data:", error);
    return { success: false, error: "Failed to export transactions" };
  }
}

// ============================================
// GET FORECAST EXPORT DATA
// ============================================

export async function getForecastExportData(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResponse<ForecastExportData>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Build where clause
    const whereClause: {
      userId: string;
      weekStart?: { gte?: Date };
      weekEnd?: { lte?: Date };
    } = { userId };

    if (startDate) {
      whereClause.weekStart = { gte: startDate };
    }
    if (endDate) {
      whereClause.weekEnd = { lte: endDate };
    }

    const weeks = await prisma.forecastWeek.findMany({
      where: whereClause,
      orderBy: { weekStart: "desc" },
    });

    let totalProjected = 0;
    let totalActual = 0;
    let hasActualData = false;
    let accuracySum = 0;
    let accuracyCount = 0;

    const exportWeeks = weeks.map((week) => {
      const projectedTotal = toNumber(week.projectedTotal);
      const actualTotal = toNumberOrNull(week.actualTotal);
      const variance =
        actualTotal !== null ? actualTotal - projectedTotal : null;
      const variancePercent =
        actualTotal !== null && projectedTotal > 0
          ? ((actualTotal - projectedTotal) / projectedTotal) * 100
          : null;
      const accuracy = calculateAccuracy(projectedTotal, actualTotal);

      totalProjected += projectedTotal;
      if (actualTotal !== null) {
        hasActualData = true;
        totalActual += actualTotal;
      }
      if (accuracy !== null) {
        accuracySum += accuracy;
        accuracyCount += 1;
      }

      return {
        weekLabel: `${format(week.weekStart, "MMM d")} - ${format(week.weekEnd, "MMM d, yyyy")}`,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        projectedTours: week.projectedTours,
        projectedLoads: week.projectedLoads,
        projectedTourPay: toNumber(week.projectedTourPay),
        projectedAccessorials: toNumber(week.projectedAccessorials),
        projectedTotal,
        actualTours: week.actualTours,
        actualLoads: week.actualLoads,
        actualTourPay: toNumberOrNull(week.actualTourPay),
        actualAccessorials: toNumberOrNull(week.actualAccessorials),
        actualAdjustments: toNumberOrNull(week.actualAdjustments),
        actualTotal,
        variance,
        variancePercent,
        accuracy,
      };
    });

    return {
      success: true,
      data: {
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        weeks: exportWeeks,
        summary: {
          totalProjected,
          totalActual: hasActualData ? totalActual : null,
          totalVariance: hasActualData ? totalActual - totalProjected : null,
          averageAccuracy: accuracyCount > 0 ? accuracySum / accuracyCount : null,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get forecast export data:", error);
    return { success: false, error: "Failed to export forecast data" };
  }
}

// ============================================
// GET CPA PACKAGE DATA
// ============================================

export async function getCPAPackageData(
  quarter: QuarterOption
): Promise<ActionResponse<CPAPackageData>> {
  try {
    // Get P&L for the quarter
    const plResult = await getPLReportData(
      "month",
      quarter.quarterStart,
      quarter.quarterEnd
    );

    if (!plResult.success || !plResult.data) {
      return { success: false, error: "Failed to get P&L data" };
    }

    // Get transactions for the quarter
    const transactionsResult = await getTransactionExportData(
      quarter.quarterStart,
      quarter.quarterEnd
    );

    if (!transactionsResult.success || !transactionsResult.data) {
      return { success: false, error: "Failed to get transaction data" };
    }

    // Get forecast data for the quarter
    const forecastResult = await getForecastExportData(
      quarter.quarterStart,
      quarter.quarterEnd
    );

    if (!forecastResult.success || !forecastResult.data) {
      return { success: false, error: "Failed to get forecast data" };
    }

    // Update P&L period to reflect quarter
    const plData = plResult.data;
    plData.period = {
      type: "month",
      startDate: quarter.quarterStart,
      endDate: quarter.quarterEnd,
      label: quarter.label,
    };

    return {
      success: true,
      data: {
        quarter,
        plStatement: plData,
        transactions: transactionsResult.data,
        forecastSummary: forecastResult.data,
      },
    };
  } catch (error) {
    console.error("Failed to get CPA package data:", error);
    return { success: false, error: "Failed to generate CPA package" };
  }
}

// ============================================
// GET CATEGORIES FOR FILTER
// ============================================

export async function getCategoriesForFilter(): Promise<
  ActionResponse<Array<{ id: string; name: string; type: string }>>
> {
  try {
    await requireAuth();

    const categories = await prisma.category.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to get categories:", error);
    return { success: false, error: "Failed to load categories" };
  }
}
