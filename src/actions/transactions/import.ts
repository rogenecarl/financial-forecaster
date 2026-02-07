"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ImportTransactionRow, ImportPreviewItem, CategoryType } from "@/schema/transaction.schema";
import type { ActionResponse } from "@/types/api";
import type { CategoryRule, Category } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

export type ImportMode = "REPLACE" | "APPEND";

export interface ImportResult {
  totalImported: number;
  totalSkipped: number;
  totalReplaced: number;
  categoriesCreated: number;
  errors: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateId: string | null;
}

// ============================================
// HIGHER CATEGORY MAPPING
// ============================================

// Map CSV higher category strings to CategoryType enum
function mapHigherCategoryToType(higherCategory: string | null | undefined): CategoryType {
  if (!higherCategory) return "UNCATEGORIZED";

  const normalized = higherCategory.toLowerCase().trim();

  switch (normalized) {
    case "revenue":
      return "REVENUE";
    case "contra-revenue":
    case "contra revenue":
    case "contra_revenue":
      return "CONTRA_REVENUE";
    case "cost of goods sold":
    case "cogs":
    case "cost_of_goods_sold":
      return "COGS";
    case "operating expenses":
    case "operating expense":
    case "opex":
    case "operating_expense":
      return "OPERATING_EXPENSE";
    case "equity":
      return "EQUITY";
    default:
      return "UNCATEGORIZED";
  }
}

// Normalize category name for consistent storage and matching
function normalizeCategoryName(name: string): string {
  // Trim and collapse multiple whitespace to single space
  return name.trim().replace(/\s+/g, " ");
}

// Default colors for auto-created categories based on type
function getDefaultColorForType(type: CategoryType): string {
  switch (type) {
    case "REVENUE":
      return "#22c55e"; // green
    case "CONTRA_REVENUE":
      return "#f97316"; // orange
    case "COGS":
      return "#ef4444"; // red
    case "OPERATING_EXPENSE":
      return "#3b82f6"; // blue
    case "EQUITY":
      return "#8b5cf6"; // violet
    default:
      return "#64748b"; // slate
  }
}

// ============================================
// DUPLICATE DETECTION
// ============================================

async function checkDuplicate(
  userId: string,
  transaction: ImportTransactionRow
): Promise<DuplicateCheckResult> {
  // Check for exact match on date, description, and amount
  // Pass amount as string to avoid JS float → Decimal precision issues
  const existing = await prisma.transaction.findFirst({
    where: {
      userId,
      postingDate: transaction.postingDate,
      description: transaction.description,
      amount: Number(transaction.amount).toFixed(2),
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
  transactions: ImportTransactionRow[],
  transactionBatchId?: string,
  mode: ImportMode = "APPEND"
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

    // Get all existing categories for CSV category matching
    const allCategories = await prisma.category.findMany({
      select: { id: true, name: true, type: true },
    });

    // Create a map for fast category lookup by name (case-insensitive)
    const categoryByName = new Map<string, Category>();
    for (const cat of allCategories) {
      categoryByName.set(cat.name.toLowerCase(), cat as Category);
    }

    // Batch duplicate check: fetch all existing transactions that could be duplicates
    // Pass amounts as strings to avoid JS float → PostgreSQL Decimal precision mismatches
    // In REPLACE mode, exclude transactions in the target batch (they'll be deleted)
    const duplicateWhere: Record<string, unknown> = {
      userId,
      OR: transactions.map((t) => ({
        postingDate: t.postingDate,
        description: t.description,
        amount: Number(t.amount).toFixed(2),
      })),
    };
    if (mode === "REPLACE" && transactionBatchId) {
      duplicateWhere.transactionBatchId = { not: transactionBatchId };
    }

    const existingTransactions = await prisma.transaction.findMany({
      where: duplicateWhere,
      select: {
        id: true,
        postingDate: true,
        description: true,
        amount: true,
      },
    });

    // Create a Set for fast duplicate lookup using composite key
    // Normalize amounts with toFixed(2) so Prisma Decimal and JS Number produce identical keys
    const existingKeys = new Map<string, string>();
    for (const txn of existingTransactions) {
      const key = `${txn.postingDate.toISOString()}|${txn.description}|${Number(txn.amount).toFixed(2)}`;
      existingKeys.set(key, txn.id);
    }

    // Process all transactions with in-memory rule matching and duplicate checking
    const previewItems: ImportPreviewItem[] = transactions.map((transaction, i) => {
      // Check for duplicate using pre-fetched data
      const key = `${new Date(transaction.postingDate).toISOString()}|${transaction.description}|${Number(transaction.amount).toFixed(2)}`;
      const duplicateId = existingKeys.get(key) || null;
      const isDuplicate = !!duplicateId;

      let categoryId: string | null = null;
      let categoryName: string | null = null;
      let matchedRule: string | null = null;
      let confidence = 0;
      let csvCategoryMatched = false;
      let csvCategoryCreated = false;

      // Priority 1: Use CSV-provided category if available
      if (transaction.csvCategory) {
        // Normalize category name for consistent matching
        const normalizedCsvCategory = transaction.csvCategory.trim().replace(/\s+/g, " ");
        const lookupKey = normalizedCsvCategory.toLowerCase();
        const existingCategory = categoryByName.get(lookupKey);

        if (existingCategory) {
          // Category exists, use it
          categoryId = existingCategory.id;
          categoryName = existingCategory.name;
          confidence = 1.0; // 100% confidence for CSV-provided category
          csvCategoryMatched = true;
        } else {
          // Category will be created during import
          categoryName = normalizedCsvCategory;
          confidence = 1.0; // Will be created during import
          csvCategoryCreated = true;
        }
      }

      // Priority 2: Apply rules if no CSV category matched
      if (!csvCategoryMatched && !csvCategoryCreated) {
        for (const rule of rules) {
          if (matchRule(rule, transaction)) {
            categoryId = rule.categoryId;
            categoryName = rule.category.name;
            matchedRule = rule.pattern;
            confidence = 0.95; // High confidence for rule matches
            break;
          }
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
        csvCategoryMatched,
        csvCategoryCreated,
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
  fileType: "CSV" | "XLSX",
  transactionBatchId?: string,
  mode: ImportMode = "APPEND"
): Promise<ActionResponse<ImportResult>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // REPLACE mode: delete all existing transactions in the batch first
    let totalReplaced = 0;
    if (mode === "REPLACE" && transactionBatchId) {
      const deleted = await prisma.transaction.deleteMany({
        where: { transactionBatchId, userId },
      });
      totalReplaced = deleted.count;
    }

    // Filter out duplicates
    const itemsToImport = items.filter((item) => !item.isDuplicate);

    if (itemsToImport.length === 0) {
      // If REPLACE mode deleted existing, still recalculate and report success
      if (totalReplaced > 0 && transactionBatchId) {
        const { recalculateBatchFinancials } = await import("./transaction-batches");
        await recalculateBatchFinancials(transactionBatchId);
      }
      return {
        success: false,
        error: "No new transactions to import. All are duplicates.",
      };
    }

    // AI confidence threshold (hardcoded default)
    const confidenceThreshold = 0.8;

    // Step 1: Create categories from CSV data if needed
    const categoriesToCreate = new Map<string, { name: string; type: CategoryType; higherCategory: string | null }>();

    for (const item of itemsToImport) {
      if (item.csvCategoryCreated && item.transaction.csvCategory) {
        // Normalize category name for consistent storage
        const categoryName = normalizeCategoryName(item.transaction.csvCategory);
        const categoryKey = categoryName.toLowerCase();

        if (!categoriesToCreate.has(categoryKey)) {
          const categoryType = mapHigherCategoryToType(item.transaction.csvHigherCategory);
          categoriesToCreate.set(categoryKey, {
            name: categoryName,
            type: categoryType,
            higherCategory: item.transaction.csvHigherCategory || null,
          });
        }
      }
    }

    // Create new categories and build a map of name -> id
    const categoryNameToId = new Map<string, string>();
    let categoriesCreated = 0;

    // First, fetch ALL existing categories to do case-insensitive matching
    // This prevents creating duplicates like "Software" and "software"
    const allExistingCategories = await prisma.category.findMany({
      select: { id: true, name: true },
    });

    // Build case-insensitive lookup of existing categories
    for (const cat of allExistingCategories) {
      const key = cat.name.toLowerCase();
      // Only store the first occurrence (existing category takes precedence)
      if (!categoryNameToId.has(key)) {
        categoryNameToId.set(key, cat.id);
      }
    }

    // Create categories that don't exist (case-insensitive check)
    for (const [key, catData] of categoriesToCreate.entries()) {
      if (!categoryNameToId.has(key)) {
        const newCategory = await prisma.category.create({
          data: {
            name: catData.name,
            type: catData.type,
            color: getDefaultColorForType(catData.type),
            isSystem: false,
            sortOrder: 50, // Default middle sort order
          },
        });
        categoryNameToId.set(key, newCategory.id);
        categoriesCreated++;
      }
    }

    // Note: allExistingCategories was already loaded above and categoryNameToId is fully populated

    // Step 2: Prepare all transaction data for batch insert
    const transactionData = itemsToImport.map((item) => {
      let categoryId: string | null = item.suggestedCategoryId;

      // If CSV category was to be created, look up the newly created category
      if (item.csvCategoryCreated && item.transaction.csvCategory) {
        // Use normalized name for lookup to match how we stored it
        const normalizedName = normalizeCategoryName(item.transaction.csvCategory).toLowerCase();
        const newCatId = categoryNameToId.get(normalizedName);
        if (newCatId) {
          categoryId = newCatId;
        }
      }

      // If CSV category was matched (existing), use suggestedCategoryId
      // which was already set in preview

      const shouldAutoApply = Boolean(
        categoryId && item.confidence >= confidenceThreshold
      );

      // Determine review status
      let reviewStatus: "REVIEWED" | "FLAGGED" | "PENDING" = "PENDING";
      if (shouldAutoApply) {
        // CSV-provided categories and rule matches are auto-reviewed
        if (item.csvCategoryMatched || item.csvCategoryCreated || item.matchedRule) {
          reviewStatus = "REVIEWED";
        }
      } else if (item.confidence > 0 && item.confidence < confidenceThreshold) {
        reviewStatus = "FLAGGED";
      }

      return {
        userId,
        transactionBatchId: transactionBatchId || null,
        details: item.transaction.details,
        postingDate: item.transaction.postingDate,
        description: item.transaction.description,
        amount: item.transaction.amount,
        type: item.transaction.type,
        balance: item.transaction.balance,
        checkOrSlipNum: item.transaction.checkOrSlipNum,
        categoryId: shouldAutoApply ? categoryId : null,
        aiCategorized: shouldAutoApply && !item.csvCategoryMatched && !item.csvCategoryCreated,
        aiConfidence: item.confidence > 0 ? item.confidence : null,
        reviewStatus,
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
      if (item.matchedRule && shouldAutoApply && !item.csvCategoryMatched && !item.csvCategoryCreated) {
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

    // Step 5: If importing into a transaction batch, recalculate financials
    if (transactionBatchId) {
      const { recalculateBatchFinancials } = await import("./transaction-batches");
      await recalculateBatchFinancials(transactionBatchId);

      // Update batch import tracking
      await prisma.transactionBatch.update({
        where: { id: transactionBatchId },
        data: {
          lastImportFileName: fileName,
          lastImportedAt: new Date(),
        },
      });
    }

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/categories"); // Categories may have been created

    return {
      success: true,
      data: {
        totalImported: createResult.count,
        totalSkipped: items.length - itemsToImport.length,
        totalReplaced,
        categoriesCreated,
        errors: [],
      },
    };
  } catch (error) {
    console.error("Failed to import transactions:", error);
    return { success: false, error: "Failed to import transactions" };
  }
}
