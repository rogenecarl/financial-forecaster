"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import {
  transactionFilterSchema,
  updateTransactionSchema,
  bulkUpdateCategorySchema,
  type TransactionFilter,
} from "@/schema/transaction.schema";
import type { ActionResponse } from "@/types/api";
import type { Transaction, Category, Prisma } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

// Serialized transaction type (Decimal converted to number)
export type SerializedTransaction = Omit<Transaction, "amount" | "balance" | "aiConfidence"> & {
  amount: number;
  balance: number | null;
  aiConfidence: number | null;
};

export type TransactionWithCategory = SerializedTransaction & {
  category: Category | null;
};

// ============================================
// SERIALIZATION HELPER
// ============================================

type TransactionWithOptionalCategory = Transaction & { category?: Category | null };

function serializeTransaction(
  transaction: TransactionWithOptionalCategory
): TransactionWithCategory {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    balance: transaction.balance !== null ? Number(transaction.balance) : null,
    aiConfidence: transaction.aiConfidence !== null ? Number(transaction.aiConfidence) : null,
    category: transaction.category ?? null,
  };
}

function serializeTransactions(
  transactions: TransactionWithOptionalCategory[]
): TransactionWithCategory[] {
  return transactions.map(serializeTransaction);
}

export interface TransactionListResult {
  transactions: TransactionWithCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// GET TRANSACTIONS
// ============================================

export async function getTransactions(
  filters?: Partial<TransactionFilter>
): Promise<ActionResponse<TransactionListResult>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Validate and apply defaults to filters
    const validatedFilters = transactionFilterSchema.parse(filters || {});

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Text search
    if (validatedFilters.search) {
      where.description = {
        contains: validatedFilters.search,
        mode: "insensitive",
      };
    }

    // Category filter
    if (validatedFilters.categoryId) {
      where.categoryId = validatedFilters.categoryId;
    } else if (validatedFilters.categoryIds && validatedFilters.categoryIds.length > 0) {
      where.categoryId = { in: validatedFilters.categoryIds };
    }

    // Uncategorized only
    if (validatedFilters.uncategorizedOnly) {
      where.categoryId = null;
    }

    // AI categorized only
    if (validatedFilters.aiCategorizedOnly) {
      where.aiCategorized = true;
    }

    // Type filter
    if (validatedFilters.type) {
      where.type = validatedFilters.type;
    }

    // Details filter
    if (validatedFilters.details) {
      where.details = validatedFilters.details;
    }

    // Review status
    if (validatedFilters.reviewStatus) {
      where.reviewStatus = validatedFilters.reviewStatus;
    }

    // Date range
    if (validatedFilters.dateFrom || validatedFilters.dateTo) {
      where.postingDate = {};
      if (validatedFilters.dateFrom) {
        where.postingDate.gte = validatedFilters.dateFrom;
      }
      if (validatedFilters.dateTo) {
        where.postingDate.lte = validatedFilters.dateTo;
      }
    }

    // Amount range
    if (validatedFilters.minAmount !== undefined || validatedFilters.maxAmount !== undefined) {
      where.amount = {};
      if (validatedFilters.minAmount !== undefined) {
        where.amount.gte = validatedFilters.minAmount;
      }
      if (validatedFilters.maxAmount !== undefined) {
        where.amount.lte = validatedFilters.maxAmount;
      }
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [validatedFilters.sortBy]: validatedFilters.sortOrder,
      },
      skip: (validatedFilters.page - 1) * validatedFilters.limit,
      take: validatedFilters.limit,
    });

    // Serialize to convert Decimal to number for client components
    const serializedTransactions = serializeTransactions(transactions);

    return {
      success: true,
      data: {
        transactions: serializedTransactions,
        total,
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        totalPages: Math.ceil(total / validatedFilters.limit),
      },
    };
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

// ============================================
// GET SINGLE TRANSACTION
// ============================================

export async function getTransactionById(
  id: string
): Promise<ActionResponse<TransactionWithCategory>> {
  try {
    const session = await requireAuth();

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return { success: true, data: serializeTransaction(transaction) };
  } catch (error) {
    console.error("Failed to fetch transaction:", error);
    return { success: false, error: "Failed to fetch transaction" };
  }
}

// ============================================
// UPDATE TRANSACTION
// ============================================

export async function updateTransaction(
  data: unknown
): Promise<ActionResponse<TransactionWithCategory>> {
  try {
    const session = await requireAuth();

    const validated = updateTransactionSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid data",
      };
    }

    const { id, ...updateData } = validated.data;

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Transaction not found" };
    }

    // If category is being set manually, mark as manual override
    const finalUpdateData: Prisma.TransactionUpdateInput = {
      ...updateData,
    };

    if (updateData.categoryId !== undefined) {
      finalUpdateData.manualOverride = true;
      finalUpdateData.reviewStatus = "REVIEWED";
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: finalUpdateData,
      include: { category: true },
    });

    revalidatePath("/transactions");
    return { success: true, data: serializeTransaction(transaction) };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

// ============================================
// DELETE TRANSACTION
// ============================================

export async function deleteTransaction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Transaction not found" };
    }

    await prisma.transaction.delete({ where: { id } });

    revalidatePath("/transactions");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}

// ============================================
// BULK UPDATE CATEGORY
// ============================================

export async function bulkUpdateCategory(
  data: unknown
): Promise<ActionResponse<{ updatedCount: number }>> {
  try {
    const session = await requireAuth();

    const validated = bulkUpdateCategorySchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid data",
      };
    }

    const { transactionIds, categoryId, createRule, rulePattern } = validated.data;

    // Verify all transactions belong to user
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: session.user.id,
      },
    });

    if (transactions.length !== transactionIds.length) {
      return { success: false, error: "Some transactions were not found" };
    }

    // Update all transactions
    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        userId: session.user.id,
      },
      data: {
        categoryId,
        manualOverride: true,
        reviewStatus: "REVIEWED",
      },
    });

    // Optionally create a categorization rule
    if (createRule && rulePattern) {
      await prisma.categoryRule.create({
        data: {
          userId: session.user.id,
          categoryId,
          pattern: rulePattern,
          matchType: "contains",
          field: "description",
          priority: 50,
          isActive: true,
        },
      });
    }

    revalidatePath("/transactions");
    return { success: true, data: { updatedCount: result.count } };
  } catch (error) {
    console.error("Failed to bulk update category:", error);
    return { success: false, error: "Failed to update transactions" };
  }
}

// ============================================
// GET TRANSACTION STATS
// ============================================

export async function getTransactionStats(): Promise<
  ActionResponse<{
    total: number;
    uncategorized: number;
    pendingReview: number;
    thisWeekAmount: number;
    thisMonthAmount: number;
  }>
> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, uncategorized, pendingReview, thisWeekTxns, thisMonthTxns] =
      await Promise.all([
        prisma.transaction.count({ where: { userId } }),
        prisma.transaction.count({ where: { userId, categoryId: null } }),
        prisma.transaction.count({ where: { userId, reviewStatus: "PENDING" } }),
        prisma.transaction.findMany({
          where: { userId, postingDate: { gte: startOfWeek } },
          select: { amount: true },
        }),
        prisma.transaction.findMany({
          where: { userId, postingDate: { gte: startOfMonth } },
          select: { amount: true },
        }),
      ]);

    const thisWeekAmount = thisWeekTxns.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const thisMonthAmount = thisMonthTxns.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    return {
      success: true,
      data: {
        total,
        uncategorized,
        pendingReview,
        thisWeekAmount,
        thisMonthAmount,
      },
    };
  } catch (error) {
    console.error("Failed to fetch transaction stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
