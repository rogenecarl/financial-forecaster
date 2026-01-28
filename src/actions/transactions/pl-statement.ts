"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { PLStatement, PLLineItem, PLPeriod } from "@/schema/transaction.schema";

// ============================================
// TYPES
// ============================================

export interface PLSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  uncategorizedCount: number;
  uncategorizedAmount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6); // End of week (Saturday)
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getQuarterRange(date: Date = new Date()): { start: Date; end: Date } {
  const quarter = Math.floor(date.getMonth() / 3);
  const start = new Date(date.getFullYear(), quarter * 3, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getYearRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), 11, 31);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getPeriodRange(
  periodType: PLPeriod["type"],
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } {
  switch (periodType) {
    case "week":
      return getWeekRange();
    case "month":
      return getMonthRange();
    case "quarter":
      return getQuarterRange();
    case "year":
      return getYearRange();
    case "custom":
      if (!customStart || !customEnd) {
        throw new Error("Custom period requires start and end dates");
      }
      return { start: customStart, end: customEnd };
    default:
      return getWeekRange();
  }
}

// ============================================
// P&L STATEMENT
// ============================================

export async function getPLStatement(
  periodType: PLPeriod["type"] = "week",
  customStart?: Date,
  customEnd?: Date
): Promise<ActionResponse<PLStatement>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get date range
    const { start, end } = getPeriodRange(periodType, customStart, customEnd);

    // Fetch all transactions in the period with their categories
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        postingDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        category: true,
      },
    });

    // Group transactions by category
    const categoryGroups = new Map<
      string,
      {
        category: typeof transactions[0]["category"];
        transactions: typeof transactions;
      }
    >();

    let uncategorizedCount = 0;
    let uncategorizedAmount = 0;

    for (const txn of transactions) {
      if (!txn.categoryId || !txn.category) {
        uncategorizedCount++;
        uncategorizedAmount += Number(txn.amount);
        continue;
      }

      // Skip categories not included in P&L
      if (!txn.category.includeInPL) {
        continue;
      }

      const key = txn.categoryId;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, {
          category: txn.category,
          transactions: [],
        });
      }
      categoryGroups.get(key)!.transactions.push(txn);
    }

    // Calculate totals
    const revenueItems: PLLineItem[] = [];
    const expenseItems: PLLineItem[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const [, group] of categoryGroups) {
      if (!group.category) continue;

      const amount = group.transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      const lineItem: PLLineItem = {
        categoryId: group.category.id,
        categoryName: group.category.name,
        categoryColor: group.category.color,
        categoryType: group.category.type as PLLineItem["categoryType"],
        amount,
        transactionCount: group.transactions.length,
        percentage: 0, // Calculate after totals are known
      };

      if (group.category.type === "REVENUE") {
        revenueItems.push(lineItem);
        totalRevenue += amount;
      } else if (group.category.type === "EXPENSE") {
        expenseItems.push(lineItem);
        totalExpenses += Math.abs(amount); // Expenses are typically negative
      }
    }

    // Calculate percentages
    for (const item of revenueItems) {
      item.percentage = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
    }

    for (const item of expenseItems) {
      item.percentage =
        totalExpenses > 0 ? (Math.abs(item.amount) / totalExpenses) * 100 : 0;
    }

    // Sort by amount (descending)
    revenueItems.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    expenseItems.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const statement: PLStatement = {
      period: {
        type: periodType,
        startDate: start,
        endDate: end,
      },
      revenue: {
        items: revenueItems,
        total: totalRevenue,
      },
      expenses: {
        items: expenseItems,
        total: totalExpenses,
      },
      netProfit: totalRevenue - totalExpenses,
      uncategorizedCount,
      uncategorizedAmount,
    };

    return { success: true, data: statement };
  } catch (error) {
    console.error("Failed to generate P&L statement:", error);
    return { success: false, error: "Failed to generate P&L statement" };
  }
}

// ============================================
// P&L SUMMARY (for dashboard)
// ============================================

export async function getPLSummary(
  periodType: PLPeriod["type"] = "week"
): Promise<ActionResponse<PLSummary>> {
  try {
    const result = await getPLStatement(periodType);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (!result.data) {
      return { success: false, error: "Failed to get P&L" };
    }

    const { revenue, expenses, netProfit, uncategorizedCount, uncategorizedAmount } =
      result.data;

    const profitMargin =
      revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;

    return {
      success: true,
      data: {
        totalRevenue: revenue.total,
        totalExpenses: expenses.total,
        netProfit,
        profitMargin,
        uncategorizedCount,
        uncategorizedAmount,
      },
    };
  } catch (error) {
    console.error("Failed to get P&L summary:", error);
    return { success: false, error: "Failed to get P&L summary" };
  }
}

// ============================================
// PERIOD COMPARISON
// ============================================

export async function comparePeriods(
  currentPeriodType: PLPeriod["type"] = "week"
): Promise<
  ActionResponse<{
    current: PLSummary;
    previous: PLSummary;
    changes: {
      revenue: number;
      revenuePercent: number;
      expenses: number;
      expensesPercent: number;
      profit: number;
      profitPercent: number;
    };
  }>
> {
  try {
    // Get current period
    const currentResult = await getPLSummary(currentPeriodType);
    if (!currentResult.success) {
      return { success: false, error: currentResult.error };
    }
    if (!currentResult.data) {
      return { success: false, error: "Failed to get current period P&L" };
    }

    // Calculate previous period dates
    const now = new Date();
    let previousStart: Date;
    let previousEnd: Date;

    switch (currentPeriodType) {
      case "week": {
        const { start } = getWeekRange();
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 6);
        break;
      }
      case "month": {
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case "quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      }
      case "year": {
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      }
      default: {
        const { start } = getWeekRange();
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 6);
      }
    }

    // Get previous period P&L
    const previousResult = await getPLStatement("custom", previousStart, previousEnd);
    if (!previousResult.success) {
      return { success: false, error: previousResult.error };
    }
    if (!previousResult.data) {
      return { success: false, error: "Failed to get previous period P&L" };
    }

    const previous: PLSummary = {
      totalRevenue: previousResult.data.revenue.total,
      totalExpenses: previousResult.data.expenses.total,
      netProfit: previousResult.data.netProfit,
      profitMargin:
        previousResult.data.revenue.total > 0
          ? (previousResult.data.netProfit / previousResult.data.revenue.total) * 100
          : 0,
      uncategorizedCount: previousResult.data.uncategorizedCount,
      uncategorizedAmount: previousResult.data.uncategorizedAmount,
    };

    // Calculate changes
    const calcChange = (current: number, prev: number) => current - prev;
    const calcPercent = (current: number, prev: number) =>
      prev !== 0 ? ((current - prev) / Math.abs(prev)) * 100 : 0;

    return {
      success: true,
      data: {
        current: currentResult.data,
        previous,
        changes: {
          revenue: calcChange(currentResult.data.totalRevenue, previous.totalRevenue),
          revenuePercent: calcPercent(currentResult.data.totalRevenue, previous.totalRevenue),
          expenses: calcChange(currentResult.data.totalExpenses, previous.totalExpenses),
          expensesPercent: calcPercent(currentResult.data.totalExpenses, previous.totalExpenses),
          profit: calcChange(currentResult.data.netProfit, previous.netProfit),
          profitPercent: calcPercent(currentResult.data.netProfit, previous.netProfit),
        },
      },
    };
  } catch (error) {
    console.error("Failed to compare periods:", error);
    return { success: false, error: "Failed to compare periods" };
  }
}

// ============================================
// GET AVAILABLE DATE RANGE
// ============================================

export interface TransactionDateRange {
  minDate: Date | null;
  maxDate: Date | null;
  hasTransactions: boolean;
}

export async function getTransactionDateRange(): Promise<ActionResponse<TransactionDateRange>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get min and max posting dates
    const [minResult, maxResult] = await Promise.all([
      prisma.transaction.findFirst({
        where: { userId },
        orderBy: { postingDate: "asc" },
        select: { postingDate: true },
      }),
      prisma.transaction.findFirst({
        where: { userId },
        orderBy: { postingDate: "desc" },
        select: { postingDate: true },
      }),
    ]);

    return {
      success: true,
      data: {
        minDate: minResult?.postingDate || null,
        maxDate: maxResult?.postingDate || null,
        hasTransactions: !!(minResult && maxResult),
      },
    };
  } catch (error) {
    console.error("Failed to get transaction date range:", error);
    return { success: false, error: "Failed to get transaction date range" };
  }
}
