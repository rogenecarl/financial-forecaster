"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { TransactionBatchStatus } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

export interface TransactionBatchSummary {
  id: string;
  name: string;
  description: string | null;
  status: TransactionBatchStatus;
  lastImportFileName: string | null;
  lastImportedAt: Date | null;
  transactionCount: number;
  uncategorizedCount: number;
  netRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  operatingMargin: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionBatchInput {
  name: string;
  description?: string;
}

export interface UpdateTransactionBatchInput {
  id: string;
  name?: string;
  description?: string;
}

export interface TransactionBatchFilters {
  status?: TransactionBatchStatus;
  search?: string;
  sortBy?: "createdAt" | "name" | "transactionCount" | "netRevenue";
  sortOrder?: "asc" | "desc";
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

function mapBatchToSummary(batch: {
  id: string;
  name: string;
  description: string | null;
  status: TransactionBatchStatus;
  lastImportFileName: string | null;
  lastImportedAt: Date | null;
  transactionCount: number;
  uncategorizedCount: number;
  netRevenue: unknown;
  grossProfit: unknown;
  operatingIncome: unknown;
  operatingMargin: number;
  createdAt: Date;
  updatedAt: Date;
}): TransactionBatchSummary {
  return {
    id: batch.id,
    name: batch.name,
    description: batch.description,
    status: batch.status,
    lastImportFileName: batch.lastImportFileName,
    lastImportedAt: batch.lastImportedAt,
    transactionCount: batch.transactionCount,
    uncategorizedCount: batch.uncategorizedCount,
    netRevenue: toNumber(batch.netRevenue),
    grossProfit: toNumber(batch.grossProfit),
    operatingIncome: toNumber(batch.operatingIncome),
    operatingMargin: batch.operatingMargin,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createTransactionBatch(
  input: CreateTransactionBatchInput
): Promise<ActionResponse<TransactionBatchSummary>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.transactionBatch.create({
      data: {
        userId: session.user.id,
        name: input.name,
        description: input.description || null,
        status: "EMPTY",
      },
    });

    return {
      success: true,
      data: mapBatchToSummary(batch),
    };
  } catch (error) {
    console.error("Failed to create transaction batch:", error);
    return { success: false, error: "Failed to create batch" };
  }
}

export async function updateTransactionBatch(
  input: UpdateTransactionBatchInput
): Promise<ActionResponse<TransactionBatchSummary>> {
  try {
    const session = await requireAuth();

    const existing = await prisma.transactionBatch.findFirst({
      where: { id: input.id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Batch not found" };
    }

    const batch = await prisma.transactionBatch.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });

    return {
      success: true,
      data: mapBatchToSummary(batch),
    };
  } catch (error) {
    console.error("Failed to update transaction batch:", error);
    return { success: false, error: "Failed to update batch" };
  }
}

export async function deleteTransactionBatch(
  batchId: string
): Promise<ActionResponse<{ deletedTransactions: number }>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.transactionBatch.findFirst({
      where: { id: batchId, userId: session.user.id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    const txnCount = batch._count.transactions;

    // Delete all transactions in the batch, then the batch itself
    await prisma.$transaction([
      prisma.transaction.deleteMany({
        where: { transactionBatchId: batchId },
      }),
      prisma.transactionBatch.delete({
        where: { id: batchId },
      }),
    ]);

    revalidatePath("/transactions");

    return {
      success: true,
      data: { deletedTransactions: txnCount },
    };
  } catch (error) {
    console.error("Failed to delete transaction batch:", error);
    return { success: false, error: "Failed to delete batch" };
  }
}

export async function getTransactionBatch(
  batchId: string
): Promise<ActionResponse<TransactionBatchSummary>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.transactionBatch.findFirst({
      where: { id: batchId, userId: session.user.id },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    return {
      success: true,
      data: mapBatchToSummary(batch),
    };
  } catch (error) {
    console.error("Failed to get transaction batch:", error);
    return { success: false, error: "Failed to load batch" };
  }
}

export async function getTransactionBatches(
  filters?: TransactionBatchFilters
): Promise<ActionResponse<TransactionBatchSummary[]>> {
  try {
    const session = await requireAuth();

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, string> = {};
    const sortBy = filters?.sortBy || "createdAt";
    const sortOrder = filters?.sortOrder || "desc";
    orderBy[sortBy] = sortOrder;

    const batches = await prisma.transactionBatch.findMany({
      where,
      orderBy,
    });

    return {
      success: true,
      data: batches.map(mapBatchToSummary),
    };
  } catch (error) {
    console.error("Failed to get transaction batches:", error);
    return { success: false, error: "Failed to load batches" };
  }
}

// ============================================
// RECALCULATE BATCH FINANCIALS
// ============================================

export async function recalculateBatchFinancials(
  batchId: string
): Promise<ActionResponse<TransactionBatchSummary>> {
  try {
    const session = await requireAuth();

    const batch = await prisma.transactionBatch.findFirst({
      where: { id: batchId, userId: session.user.id },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    // Fetch all transactions in the batch with their categories
    const transactions = await prisma.transaction.findMany({
      where: { transactionBatchId: batchId },
      include: { category: true },
    });

    const transactionCount = transactions.length;
    let uncategorizedCount = 0;

    // Accumulate P&L by category type
    let revenueTotal = 0;
    let contraRevenueTotal = 0;
    let cogsTotal = 0;
    let opexTotal = 0;

    for (const txn of transactions) {
      if (!txn.categoryId || !txn.category) {
        uncategorizedCount++;
        continue;
      }

      const amount = Number(txn.amount);

      switch (txn.category.type) {
        case "REVENUE":
          revenueTotal += amount;
          break;
        case "CONTRA_REVENUE":
          contraRevenueTotal += amount;
          break;
        case "COGS":
          cogsTotal += amount;
          break;
        case "OPERATING_EXPENSE":
          opexTotal += amount;
          break;
        case "UNCATEGORIZED":
          uncategorizedCount++;
          break;
        // EQUITY is excluded from P&L
      }
    }

    // Calculate multi-tier P&L (same logic as pl-statement.ts)
    const netRevenue = revenueTotal + contraRevenueTotal;
    const grossProfit = netRevenue + cogsTotal; // COGS is negative
    const operatingIncome = grossProfit + opexTotal; // opex is negative
    const operatingMargin = netRevenue !== 0 ? (operatingIncome / netRevenue) * 100 : 0;

    // Determine status
    let newStatus: TransactionBatchStatus = "EMPTY";
    if (transactionCount > 0) {
      newStatus = uncategorizedCount === 0 ? "RECONCILED" : "ACTIVE";
    }

    const updated = await prisma.transactionBatch.update({
      where: { id: batchId },
      data: {
        transactionCount,
        uncategorizedCount,
        netRevenue,
        grossProfit,
        operatingIncome,
        operatingMargin,
        status: newStatus,
      },
    });

    return {
      success: true,
      data: mapBatchToSummary(updated),
    };
  } catch (error) {
    console.error("Failed to recalculate batch financials:", error);
    return { success: false, error: "Failed to recalculate financials" };
  }
}
