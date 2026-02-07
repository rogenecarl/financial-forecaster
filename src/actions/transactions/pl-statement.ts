"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { PLStatement, PLLineItem, PLPeriod, PLSection } from "@/schema/transaction.schema";

// ============================================
// TYPES
// ============================================

export interface PLSummary {
  totalRevenue: number;
  netRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  operatingMargin: number;
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
      return getMonthRange();
  }
}

// ============================================
// P&L STATEMENT - Multi-Tier Structure
// ============================================

export async function getPLStatement(
  periodType: PLPeriod["type"] = "month",
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

    // Initialize sections
    const revenueGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();
    const contraRevenueGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();
    const cogsGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();
    const opexGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();

    let uncategorizedCount = 0;
    let uncategorizedAmount = 0;
    let equityCount = 0;
    let equityAmount = 0;

    // Group transactions by category type
    for (const txn of transactions) {
      if (!txn.categoryId || !txn.category) {
        uncategorizedCount++;
        uncategorizedAmount += Number(txn.amount);
        continue;
      }

      const category = txn.category;
      const key = txn.categoryId;

      switch (category.type) {
        case "REVENUE":
          if (!revenueGroups.has(key)) {
            revenueGroups.set(key, { category, transactions: [] });
          }
          revenueGroups.get(key)!.transactions.push(txn);
          break;

        case "CONTRA_REVENUE":
          if (!contraRevenueGroups.has(key)) {
            contraRevenueGroups.set(key, { category, transactions: [] });
          }
          contraRevenueGroups.get(key)!.transactions.push(txn);
          break;

        case "COGS":
          if (!cogsGroups.has(key)) {
            cogsGroups.set(key, { category, transactions: [] });
          }
          cogsGroups.get(key)!.transactions.push(txn);
          break;

        case "OPERATING_EXPENSE":
          if (!opexGroups.has(key)) {
            opexGroups.set(key, { category, transactions: [] });
          }
          opexGroups.get(key)!.transactions.push(txn);
          break;

        case "EQUITY":
          equityCount++;
          equityAmount += Number(txn.amount);
          break;

        case "UNCATEGORIZED":
          uncategorizedCount++;
          uncategorizedAmount += Number(txn.amount);
          break;
      }
    }

    // Helper function to convert groups to line items
    const groupsToSection = (
      groups: Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>
    ): PLSection => {
      const items: PLLineItem[] = [];
      let total = 0;

      for (const [, group] of groups) {
        const amount = group.transactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );
        total += amount;

        items.push({
          categoryId: group.category.id,
          categoryName: group.category.name,
          categoryColor: group.category.color,
          categoryType: group.category.type as PLLineItem["categoryType"],
          amount,
          transactionCount: group.transactions.length,
          percentage: 0, // Calculate after total is known
        });
      }

      // Calculate percentages and sort by absolute amount (descending)
      for (const item of items) {
        item.percentage = total !== 0 ? (Math.abs(item.amount) / Math.abs(total)) * 100 : 0;
      }
      items.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      return { items, total };
    };

    // Build sections
    const revenue = groupsToSection(revenueGroups);
    const contraRevenue = groupsToSection(contraRevenueGroups);
    const cogs = groupsToSection(cogsGroups);
    const operatingExpenses = groupsToSection(opexGroups);

    // Calculate multi-tier P&L totals
    // Net Revenue = Revenue + Contra-Revenue (contra-revenue items are positive refund amounts that add to revenue)
    const netRevenue = revenue.total + contraRevenue.total;

    // Gross Profit = Net Revenue - |COGS| (COGS amounts are typically negative)
    const grossProfit = netRevenue + cogs.total; // cogs.total is negative, so we add

    // Operating Income = Gross Profit - |Operating Expenses| (opex amounts are typically negative)
    const operatingIncome = grossProfit + operatingExpenses.total; // opex.total is negative, so we add

    // Operating Margin = Operating Income / Net Revenue
    const operatingMargin = netRevenue !== 0 ? (operatingIncome / netRevenue) * 100 : 0;

    const statement: PLStatement = {
      period: {
        type: periodType,
        startDate: start,
        endDate: end,
      },
      revenue,
      contraRevenue,
      netRevenue,
      cogs,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      operatingMargin,
      uncategorizedCount,
      uncategorizedAmount,
      equityCount,
      equityAmount,
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
  periodType: PLPeriod["type"] = "month"
): Promise<ActionResponse<PLSummary>> {
  try {
    const result = await getPLStatement(periodType);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const {
      revenue,
      netRevenue,
      grossProfit,
      operatingIncome,
      operatingMargin,
      uncategorizedCount,
      uncategorizedAmount,
    } = result.data;

    return {
      success: true,
      data: {
        totalRevenue: revenue.total,
        netRevenue,
        grossProfit,
        operatingIncome,
        operatingMargin,
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
  currentPeriodType: PLPeriod["type"] = "month"
): Promise<
  ActionResponse<{
    current: PLSummary;
    previous: PLSummary;
    changes: {
      revenue: number;
      revenuePercent: number;
      netRevenue: number;
      netRevenuePercent: number;
      grossProfit: number;
      grossProfitPercent: number;
      operatingIncome: number;
      operatingIncomePercent: number;
    };
  }>
> {
  try {
    // Get current period
    const currentResult = await getPLSummary(currentPeriodType);
    if (!currentResult.success) {
      return { success: false, error: currentResult.error };
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
        const { start } = getMonthRange();
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 30);
      }
    }

    // Get previous period P&L
    const previousResult = await getPLStatement("custom", previousStart, previousEnd);
    if (!previousResult.success) {
      return { success: false, error: previousResult.error };
    }

    const previous: PLSummary = {
      totalRevenue: previousResult.data.revenue.total,
      netRevenue: previousResult.data.netRevenue,
      grossProfit: previousResult.data.grossProfit,
      operatingIncome: previousResult.data.operatingIncome,
      operatingMargin: previousResult.data.operatingMargin,
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
          netRevenue: calcChange(currentResult.data.netRevenue, previous.netRevenue),
          netRevenuePercent: calcPercent(currentResult.data.netRevenue, previous.netRevenue),
          grossProfit: calcChange(currentResult.data.grossProfit, previous.grossProfit),
          grossProfitPercent: calcPercent(currentResult.data.grossProfit, previous.grossProfit),
          operatingIncome: calcChange(currentResult.data.operatingIncome, previous.operatingIncome),
          operatingIncomePercent: calcPercent(currentResult.data.operatingIncome, previous.operatingIncome),
        },
      },
    };
  } catch (error) {
    console.error("Failed to compare periods:", error);
    return { success: false, error: "Failed to compare periods" };
  }
}

// ============================================
// GET TRANSACTIONS BY CATEGORY
// ============================================

export interface CategoryTransaction {
  id: string;
  postingDate: Date;
  description: string;
  amount: number;
  type: string;
  details: string;
}

export async function getTransactionsByCategory(
  categoryId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResponse<CategoryTransaction[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        postingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        postingDate: true,
        description: true,
        amount: true,
        type: true,
        details: true,
      },
      orderBy: { postingDate: "desc" },
    });

    return {
      success: true,
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch category transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

// ============================================
// BATCH P&L STATEMENT
// ============================================

export async function getBatchPLStatement(
  batchId: string
): Promise<ActionResponse<PLStatement>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Fetch all transactions in the batch with their categories
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionBatchId: batchId,
      },
      include: {
        category: true,
      },
    });

    // Initialize section groups
    const revenueGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();
    const contraRevenueGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();
    const cogsGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();
    const opexGroups = new Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>();

    let uncategorizedCount = 0;
    let uncategorizedAmount = 0;
    let equityCount = 0;
    let equityAmount = 0;

    for (const txn of transactions) {
      if (!txn.categoryId || !txn.category) {
        uncategorizedCount++;
        uncategorizedAmount += Number(txn.amount);
        continue;
      }

      const category = txn.category;
      const key = txn.categoryId;

      switch (category.type) {
        case "REVENUE":
          if (!revenueGroups.has(key)) revenueGroups.set(key, { category, transactions: [] });
          revenueGroups.get(key)!.transactions.push(txn);
          break;
        case "CONTRA_REVENUE":
          if (!contraRevenueGroups.has(key)) contraRevenueGroups.set(key, { category, transactions: [] });
          contraRevenueGroups.get(key)!.transactions.push(txn);
          break;
        case "COGS":
          if (!cogsGroups.has(key)) cogsGroups.set(key, { category, transactions: [] });
          cogsGroups.get(key)!.transactions.push(txn);
          break;
        case "OPERATING_EXPENSE":
          if (!opexGroups.has(key)) opexGroups.set(key, { category, transactions: [] });
          opexGroups.get(key)!.transactions.push(txn);
          break;
        case "EQUITY":
          equityCount++;
          equityAmount += Number(txn.amount);
          break;
        case "UNCATEGORIZED":
          uncategorizedCount++;
          uncategorizedAmount += Number(txn.amount);
          break;
      }
    }

    // Helper to convert groups to line items
    const groupsToSection = (
      groups: Map<string, { category: NonNullable<typeof transactions[0]["category"]>; transactions: typeof transactions }>
    ): PLSection => {
      const items: PLLineItem[] = [];
      let total = 0;

      for (const [, group] of groups) {
        const amount = group.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        total += amount;

        items.push({
          categoryId: group.category.id,
          categoryName: group.category.name,
          categoryColor: group.category.color,
          categoryType: group.category.type as PLLineItem["categoryType"],
          amount,
          transactionCount: group.transactions.length,
          percentage: 0,
        });
      }

      for (const item of items) {
        item.percentage = total !== 0 ? (Math.abs(item.amount) / Math.abs(total)) * 100 : 0;
      }
      items.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      return { items, total };
    };

    const revenue = groupsToSection(revenueGroups);
    const contraRevenue = groupsToSection(contraRevenueGroups);
    const cogs = groupsToSection(cogsGroups);
    const operatingExpenses = groupsToSection(opexGroups);

    const netRevenue = revenue.total + contraRevenue.total;
    const grossProfit = netRevenue + cogs.total;
    const operatingIncome = grossProfit + operatingExpenses.total;
    const operatingMargin = netRevenue !== 0 ? (operatingIncome / netRevenue) * 100 : 0;

    // Use batch date range for period info
    const dates = transactions.map((t) => new Date(t.postingDate));
    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();

    const statement: PLStatement = {
      period: {
        type: "custom",
        startDate: minDate,
        endDate: maxDate,
      },
      revenue,
      contraRevenue,
      netRevenue,
      cogs,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      operatingMargin,
      uncategorizedCount,
      uncategorizedAmount,
      equityCount,
      equityAmount,
    };

    return { success: true, data: statement };
  } catch (error) {
    console.error("Failed to generate batch P&L statement:", error);
    return { success: false, error: "Failed to generate batch P&L statement" };
  }
}

// ============================================
// GET TRANSACTIONS BY CATEGORY IN BATCH
// ============================================

export async function getTransactionsByCategoryInBatch(
  categoryId: string,
  batchId: string
): Promise<ActionResponse<CategoryTransaction[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        transactionBatchId: batchId,
      },
      select: {
        id: true,
        postingDate: true,
        description: true,
        amount: true,
        type: true,
        details: true,
      },
      orderBy: { postingDate: "desc" },
    });

    return {
      success: true,
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch batch category transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
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
