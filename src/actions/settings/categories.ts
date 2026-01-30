"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { createCategorySchema, updateCategorySchema } from "@/schema/settings.schema";
import type { ActionResponse } from "@/types/api";
import type { Category } from "@/lib/generated/prisma/client";

export async function getCategories(): Promise<ActionResponse<Category[]>> {
  try {
    await requireAuth();

    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getCategoryById(id: string): Promise<ActionResponse<Category>> {
  try {
    await requireAuth();

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}

export async function createCategory(
  data: unknown
): Promise<ActionResponse<Category>> {
  try {
    await requireAuth();

    const validatedData = createCategorySchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid data",
      };
    }

    // Check for duplicate name (case-insensitive)
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.data.name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return { success: false, error: "A category with this name already exists" };
    }

    const category = await prisma.category.create({
      data: {
        name: validatedData.data.name,
        type: validatedData.data.type,
        color: validatedData.data.color,
        sortOrder: validatedData.data.sortOrder,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  data: unknown
): Promise<ActionResponse<Category>> {
  try {
    await requireAuth();

    const validatedData = updateCategorySchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid data",
      };
    }

    const { id, ...updateData } = validatedData.data;

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Category not found" };
    }

    // Check if it's a system category (limited updates)
    if (existing.isSystem && updateData.name && updateData.name !== existing.name) {
      return { success: false, error: "Cannot rename system categories" };
    }

    // Check for duplicate name if name is being changed (case-insensitive)
    if (updateData.name && updateData.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name: {
            equals: updateData.name,
            mode: "insensitive",
          },
          NOT: { id },
        },
      });
      if (duplicate) {
        return { success: false, error: "A category with this name already exists" };
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings");
    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResponse<void>> {
  try {
    await requireAuth();

    // Check if category exists and is not a system category
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true, categoryRules: true } } },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (category.isSystem) {
      return { success: false, error: "Cannot delete system categories" };
    }

    if (category._count.transactions > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${category._count.transactions} transactions. Please reassign them first.`,
      };
    }

    // Delete associated rules first
    if (category._count.categoryRules > 0) {
      await prisma.categoryRule.deleteMany({
        where: { categoryId: id },
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

// ============================================
// DUPLICATE CATEGORY CLEANUP
// ============================================

interface DuplicateGroup {
  normalizedName: string;
  categories: Category[];
  primaryCategory: Category;
  duplicates: Category[];
}

interface CleanupResult {
  duplicateGroupsFound: number;
  categoriesMerged: number;
  transactionsReassigned: number;
  rulesReassigned: number;
  categoriesDeleted: number;
  details: string[];
}

// Normalize category name for comparison: lowercase, trim, collapse spaces
function normalizeForComparison(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Find duplicate categories (same name with different case/spacing)
 */
export async function findDuplicateCategories(): Promise<ActionResponse<DuplicateGroup[]>> {
  try {
    await requireAuth();

    const allCategories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Group by normalized name
    const groups = new Map<string, Category[]>();
    for (const cat of allCategories) {
      const key = normalizeForComparison(cat.name);
      const existing = groups.get(key) || [];
      existing.push(cat);
      groups.set(key, existing);
    }

    // Filter to only groups with duplicates
    const duplicateGroups: DuplicateGroup[] = [];
    for (const [normalizedName, categories] of groups.entries()) {
      if (categories.length > 1) {
        // Primary is the system category, or the oldest one
        const primary = categories.find(c => c.isSystem) || categories[0];
        const duplicates = categories.filter(c => c.id !== primary.id);

        duplicateGroups.push({
          normalizedName,
          categories,
          primaryCategory: primary,
          duplicates,
        });
      }
    }

    return { success: true, data: duplicateGroups };
  } catch (error) {
    console.error("Failed to find duplicate categories:", error);
    return { success: false, error: "Failed to find duplicate categories" };
  }
}

/**
 * Merge duplicate categories into the primary one and delete duplicates
 * - Reassigns all transactions from duplicates to primary
 * - Reassigns all category rules from duplicates to primary
 * - Deletes duplicate categories
 */
export async function cleanupDuplicateCategories(): Promise<ActionResponse<CleanupResult>> {
  try {
    await requireAuth();

    const result: CleanupResult = {
      duplicateGroupsFound: 0,
      categoriesMerged: 0,
      transactionsReassigned: 0,
      rulesReassigned: 0,
      categoriesDeleted: 0,
      details: [],
    };

    // Find duplicates
    const duplicatesResult = await findDuplicateCategories();
    if (!duplicatesResult.success) {
      return { success: false, error: duplicatesResult.error };
    }

    const duplicateGroups = duplicatesResult.data;
    result.duplicateGroupsFound = duplicateGroups.length;

    if (duplicateGroups.length === 0) {
      result.details.push("No duplicate categories found");
      return { success: true, data: result };
    }

    // Process each duplicate group
    for (const group of duplicateGroups) {
      const { primaryCategory, duplicates, normalizedName } = group;

      result.details.push(
        `Processing "${normalizedName}": keeping "${primaryCategory.name}" (ID: ${primaryCategory.id}), merging ${duplicates.length} duplicate(s)`
      );

      for (const duplicate of duplicates) {
        // Count transactions to reassign
        const transactionCount = await prisma.transaction.count({
          where: { categoryId: duplicate.id },
        });

        // Reassign transactions to primary category
        if (transactionCount > 0) {
          await prisma.transaction.updateMany({
            where: { categoryId: duplicate.id },
            data: { categoryId: primaryCategory.id },
          });
          result.transactionsReassigned += transactionCount;
          result.details.push(
            `  - Reassigned ${transactionCount} transaction(s) from "${duplicate.name}" to "${primaryCategory.name}"`
          );
        }

        // Count and handle category rules
        const ruleCount = await prisma.categoryRule.count({
          where: { categoryId: duplicate.id },
        });

        if (ruleCount > 0) {
          // Check if primary already has rules with same patterns
          const duplicateRules = await prisma.categoryRule.findMany({
            where: { categoryId: duplicate.id },
          });

          for (const rule of duplicateRules) {
            // Check if primary already has a rule with same pattern
            const existingRule = await prisma.categoryRule.findFirst({
              where: {
                categoryId: primaryCategory.id,
                pattern: rule.pattern,
                matchType: rule.matchType,
                field: rule.field,
              },
            });

            if (existingRule) {
              // Delete duplicate rule since primary already has it
              await prisma.categoryRule.delete({
                where: { id: rule.id },
              });
            } else {
              // Reassign rule to primary
              await prisma.categoryRule.update({
                where: { id: rule.id },
                data: { categoryId: primaryCategory.id },
              });
              result.rulesReassigned++;
            }
          }
          result.details.push(
            `  - Processed ${ruleCount} category rule(s) from "${duplicate.name}"`
          );
        }

        // Delete the duplicate category
        await prisma.category.delete({
          where: { id: duplicate.id },
        });
        result.categoriesDeleted++;
        result.categoriesMerged++;
        result.details.push(`  - Deleted duplicate category "${duplicate.name}"`);
      }
    }

    revalidatePath("/settings");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to cleanup duplicate categories:", error);
    return { success: false, error: "Failed to cleanup duplicate categories" };
  }
}

/**
 * Normalize all category names in the database
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 */
export async function normalizeAllCategoryNames(): Promise<ActionResponse<{ updated: number; details: string[] }>> {
  try {
    await requireAuth();

    const categories = await prisma.category.findMany();
    const details: string[] = [];
    let updated = 0;

    for (const cat of categories) {
      const normalized = cat.name.trim().replace(/\s+/g, " ");

      if (normalized !== cat.name) {
        // Check if normalized name conflicts with existing
        const existing = await prisma.category.findFirst({
          where: {
            name: {
              equals: normalized,
              mode: "insensitive",
            },
            NOT: { id: cat.id },
          },
        });

        if (existing) {
          details.push(
            `Skipped "${cat.name}" → "${normalized}" (conflicts with existing "${existing.name}")`
          );
        } else {
          await prisma.category.update({
            where: { id: cat.id },
            data: { name: normalized },
          });
          details.push(`Normalized "${cat.name}" → "${normalized}"`);
          updated++;
        }
      }
    }

    if (updated === 0) {
      details.push("All category names are already normalized");
    }

    revalidatePath("/settings");
    return { success: true, data: { updated, details } };
  } catch (error) {
    console.error("Failed to normalize category names:", error);
    return { success: false, error: "Failed to normalize category names" };
  }
}
