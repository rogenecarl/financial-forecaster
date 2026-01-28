"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ImportTransactionRow, ImportPreviewItem } from "@/schema/transaction.schema";
import type { ActionResponse } from "@/types/api";
import type { CategoryRule } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

export interface ImportResult {
  importBatchId: string;
  totalImported: number;
  totalSkipped: number;
  errors: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateId: string | null;
}

// ============================================
// DUPLICATE DETECTION
// ============================================

async function checkDuplicate(
  userId: string,
  transaction: ImportTransactionRow
): Promise<DuplicateCheckResult> {
  // Check for exact match on date, description, and amount
  const existing = await prisma.transaction.findFirst({
    where: {
      userId,
      postingDate: transaction.postingDate,
      description: transaction.description,
      amount: transaction.amount,
    },
    select: { id: true },
  });

  return {
    isDuplicate: !!existing,
    duplicateId: existing?.id || null,
  };
}

export async function checkDuplicates(
  transactions: ImportTransactionRow[]
): Promise<ActionResponse<DuplicateCheckResult[]>> {
  try {
    const session = await requireAuth();
    const results: DuplicateCheckResult[] = [];

    for (const transaction of transactions) {
      const result = await checkDuplicate(session.user.id, transaction);
      results.push(result);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Failed to check duplicates:", error);
    return { success: false, error: "Failed to check duplicates" };
  }
}

// ============================================
// RULE-BASED CATEGORIZATION
// ============================================

function matchRule(
  rule: CategoryRule,
  transaction: ImportTransactionRow
): boolean {
  const fieldValue =
    rule.field === "description"
      ? transaction.description
      : rule.field === "type"
      ? transaction.type
      : transaction.details;

  const pattern = rule.pattern;

  switch (rule.matchType) {
    case "contains":
      return fieldValue.toLowerCase().includes(pattern.toLowerCase());
    case "startsWith":
      return fieldValue.toLowerCase().startsWith(pattern.toLowerCase());
    case "endsWith":
      return fieldValue.toLowerCase().endsWith(pattern.toLowerCase());
    case "regex":
      try {
        const regex = new RegExp(pattern, "i");
        return regex.test(fieldValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export async function applyCategoryRules(
  transactions: { rowIndex: number; transaction: ImportTransactionRow }[]
): Promise<
  ActionResponse<
    {
      rowIndex: number;
      categoryId: string | null;
      categoryName: string | null;
      matchedRulePattern: string | null;
    }[]
  >
> {
  try {
    const session = await requireAuth();

    // Get user's active rules, sorted by priority (highest first)
    const rules = await prisma.categoryRule.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    const results = transactions.map(({ rowIndex, transaction }) => {
      // Find the first matching rule
      for (const rule of rules) {
        if (matchRule(rule, transaction)) {
          return {
            rowIndex,
            categoryId: rule.categoryId,
            categoryName: rule.category.name,
            matchedRulePattern: rule.pattern,
          };
        }
      }

      // No rule matched
      return {
        rowIndex,
        categoryId: null,
        categoryName: null,
        matchedRulePattern: null,
      };
    });

    return { success: true, data: results };
  } catch (error) {
    console.error("Failed to apply category rules:", error);
    return { success: false, error: "Failed to apply category rules" };
  }
}

// ============================================
// IMPORT PREVIEW (Optimized with batch duplicate check)
// ============================================

export async function generateImportPreview(
  transactions: ImportTransactionRow[]
): Promise<ActionResponse<ImportPreviewItem[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get user's active rules (single query)
    const rules = await prisma.categoryRule.findMany({
      where: { userId, isActive: true },
      include: { category: true },
      orderBy: { priority: "desc" },
    });

    // Batch duplicate check: fetch all existing transactions that could be duplicates
    // Create composite keys for comparison
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        OR: transactions.map((t) => ({
          postingDate: t.postingDate,
          description: t.description,
          amount: t.amount,
        })),
      },
      select: {
        id: true,
        postingDate: true,
        description: true,
        amount: true,
      },
    });

    // Create a Set for fast duplicate lookup using composite key
    const existingKeys = new Map<string, string>();
    for (const txn of existingTransactions) {
      const key = `${txn.postingDate.toISOString()}|${txn.description}|${txn.amount}`;
      existingKeys.set(key, txn.id);
    }

    // Process all transactions with in-memory rule matching and duplicate checking
    const previewItems: ImportPreviewItem[] = transactions.map((transaction, i) => {
      // Check for duplicate using pre-fetched data
      const key = `${new Date(transaction.postingDate).toISOString()}|${transaction.description}|${transaction.amount}`;
      const duplicateId = existingKeys.get(key) || null;
      const isDuplicate = !!duplicateId;

      // Apply rules for initial categorization (in-memory, no DB call)
      let categoryId: string | null = null;
      let categoryName: string | null = null;
      let matchedRule: string | null = null;
      let confidence = 0;

      for (const rule of rules) {
        if (matchRule(rule, transaction)) {
          categoryId = rule.categoryId;
          categoryName = rule.category.name;
          matchedRule = rule.pattern;
          confidence = 0.95; // High confidence for rule matches
          break;
        }
      }

      return {
        rowIndex: i,
        transaction,
        suggestedCategoryId: categoryId,
        suggestedCategoryName: categoryName,
        confidence,
        isDuplicate,
        duplicateId,
        matchedRule,
      };
    });

    return { success: true, data: previewItems };
  } catch (error) {
    console.error("Failed to generate import preview:", error);
    return { success: false, error: "Failed to generate import preview" };
  }
}

// ============================================
// IMPORT TRANSACTIONS (Optimized with batch operations)
// ============================================

export async function importTransactions(
  items: ImportPreviewItem[],
  fileName: string,
  fileType: "CSV" | "XLSX"
): Promise<ActionResponse<ImportResult>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Filter out duplicates
    const itemsToImport = items.filter((item) => !item.isDuplicate);

    if (itemsToImport.length === 0) {
      return {
        success: false,
        error: "No new transactions to import. All are duplicates.",
      };
    }

    // Get user's AI settings for confidence threshold
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    const confidenceThreshold = settings?.aiConfidenceThreshold || 0.8;

    // Step 1: Create import batch first (outside transaction for speed)
    const importBatch = await prisma.importBatch.create({
      data: {
        userId,
        fileName,
        fileType,
        recordCount: itemsToImport.length,
        status: "processing",
      },
    });

    try {
      // Step 2: Prepare all transaction data for batch insert
      const transactionData = itemsToImport.map((item) => {
        const shouldAutoApply = Boolean(
          item.suggestedCategoryId && item.confidence >= confidenceThreshold
        );

        return {
          userId,
          importBatchId: importBatch.id,
          details: item.transaction.details,
          postingDate: item.transaction.postingDate,
          description: item.transaction.description,
          amount: item.transaction.amount,
          type: item.transaction.type,
          balance: item.transaction.balance,
          checkOrSlipNum: item.transaction.checkOrSlipNum,
          categoryId: shouldAutoApply ? item.suggestedCategoryId : null,
          aiCategorized: shouldAutoApply,
          aiConfidence: item.confidence > 0 ? item.confidence : null,
          reviewStatus:
            shouldAutoApply && item.matchedRule
              ? "REVIEWED" as const
              : item.confidence > 0 && item.confidence < confidenceThreshold
              ? "FLAGGED" as const
              : "PENDING" as const,
        };
      });

      // Step 3: Bulk insert all transactions at once
      const createResult = await prisma.transaction.createMany({
        data: transactionData,
        skipDuplicates: true,
      });

      // Step 4: Aggregate and batch update rule hit counts
      const ruleHitCounts = new Map<string, number>();
      for (const item of itemsToImport) {
        const shouldAutoApply = Boolean(
          item.suggestedCategoryId && item.confidence >= confidenceThreshold
        );
        if (item.matchedRule && shouldAutoApply) {
          ruleHitCounts.set(
            item.matchedRule,
            (ruleHitCounts.get(item.matchedRule) || 0) + 1
          );
        }
      }

      // Update rule hit counts in parallel
      const ruleUpdatePromises = Array.from(ruleHitCounts.entries()).map(
        ([pattern, count]) =>
          prisma.categoryRule.updateMany({
            where: {
              userId,
              pattern,
              isActive: true,
            },
            data: {
              hitCount: { increment: count },
            },
          })
      );
      await Promise.all(ruleUpdatePromises);

      // Step 5: Mark import batch as completed
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: { status: "completed" },
      });

      revalidatePath("/transactions");
      revalidatePath("/dashboard");

      return {
        success: true,
        data: {
          importBatchId: importBatch.id,
          totalImported: createResult.count,
          totalSkipped: items.length - itemsToImport.length,
          errors: [],
        },
      };
    } catch (error) {
      // Mark import batch as failed
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: { status: "failed" },
      });
      throw error;
    }
  } catch (error) {
    console.error("Failed to import transactions:", error);
    return { success: false, error: "Failed to import transactions" };
  }
}

// ============================================
// GET IMPORT HISTORY
// ============================================

export async function getImportHistory(): Promise<
  ActionResponse<
    {
      id: string;
      fileName: string;
      fileType: string;
      recordCount: number;
      status: string;
      createdAt: Date;
    }[]
  >
> {
  try {
    const session = await requireAuth();

    const imports = await prisma.importBatch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        fileName: true,
        fileType: true,
        recordCount: true,
        status: true,
        createdAt: true,
      },
    });

    return { success: true, data: imports };
  } catch (error) {
    console.error("Failed to fetch import history:", error);
    return { success: false, error: "Failed to fetch import history" };
  }
}
