"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import {
  createCategoryRuleSchema,
  updateCategoryRuleSchema,
} from "@/schema/settings.schema";
import type { ActionResponse } from "@/types/api";
import type { CategoryRule, Category } from "@/lib/generated/prisma/client";

export type CategoryRuleWithCategory = CategoryRule & {
  category: Category;
};

export async function getCategoryRules(): Promise<
  ActionResponse<CategoryRuleWithCategory[]>
> {
  try {
    const session = await requireAuth();

    const rules = await prisma.categoryRule.findMany({
      where: { userId: session.user.id },
      include: { category: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: rules };
  } catch (error) {
    console.error("Failed to fetch category rules:", error);
    return { success: false, error: "Failed to fetch category rules" };
  }
}

export async function getCategoryRuleById(
  id: string
): Promise<ActionResponse<CategoryRuleWithCategory>> {
  try {
    const session = await requireAuth();

    const rule = await prisma.categoryRule.findFirst({
      where: { id, userId: session.user.id },
      include: { category: true },
    });

    if (!rule) {
      return { success: false, error: "Category rule not found" };
    }

    return { success: true, data: rule };
  } catch (error) {
    console.error("Failed to fetch category rule:", error);
    return { success: false, error: "Failed to fetch category rule" };
  }
}

export async function createCategoryRule(
  data: unknown
): Promise<ActionResponse<CategoryRuleWithCategory>> {
  try {
    const session = await requireAuth();

    const validatedData = createCategoryRuleSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid data",
      };
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.data.categoryId },
    });

    if (!category) {
      return { success: false, error: "Selected category does not exist" };
    }

    // Check for duplicate pattern for this user
    const existingRule = await prisma.categoryRule.findFirst({
      where: {
        userId: session.user.id,
        pattern: validatedData.data.pattern,
        field: validatedData.data.field,
      },
    });

    if (existingRule) {
      return {
        success: false,
        error: "A rule with this pattern already exists for this field",
      };
    }

    const rule = await prisma.categoryRule.create({
      data: {
        userId: session.user.id,
        categoryId: validatedData.data.categoryId,
        pattern: validatedData.data.pattern,
        matchType: validatedData.data.matchType,
        field: validatedData.data.field,
        priority: validatedData.data.priority,
        isActive: validatedData.data.isActive,
      },
      include: { category: true },
    });

    revalidatePath("/categories");
    return { success: true, data: rule };
  } catch (error) {
    console.error("Failed to create category rule:", error);
    return { success: false, error: "Failed to create category rule" };
  }
}

export async function updateCategoryRule(
  data: unknown
): Promise<ActionResponse<CategoryRuleWithCategory>> {
  try {
    const session = await requireAuth();

    const validatedData = updateCategoryRuleSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid data",
      };
    }

    const { id, ...updateData } = validatedData.data;

    // Check if rule exists and belongs to user
    const existing = await prisma.categoryRule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Category rule not found" };
    }

    // Verify category exists if being changed
    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });
      if (!category) {
        return { success: false, error: "Selected category does not exist" };
      }
    }

    // Check for duplicate pattern if pattern is being changed
    if (updateData.pattern && updateData.pattern !== existing.pattern) {
      const duplicate = await prisma.categoryRule.findFirst({
        where: {
          userId: session.user.id,
          pattern: updateData.pattern,
          field: updateData.field || existing.field,
          id: { not: id },
        },
      });
      if (duplicate) {
        return {
          success: false,
          error: "A rule with this pattern already exists for this field",
        };
      }
    }

    const rule = await prisma.categoryRule.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    revalidatePath("/categories");
    return { success: true, data: rule };
  } catch (error) {
    console.error("Failed to update category rule:", error);
    return { success: false, error: "Failed to update category rule" };
  }
}

export async function deleteCategoryRule(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();

    // Check if rule exists and belongs to user
    const rule = await prisma.categoryRule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!rule) {
      return { success: false, error: "Category rule not found" };
    }

    await prisma.categoryRule.delete({
      where: { id },
    });

    revalidatePath("/categories");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete category rule:", error);
    return { success: false, error: "Failed to delete category rule" };
  }
}

export async function toggleCategoryRuleActive(
  id: string
): Promise<ActionResponse<CategoryRuleWithCategory>> {
  try {
    const session = await requireAuth();

    const rule = await prisma.categoryRule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!rule) {
      return { success: false, error: "Category rule not found" };
    }

    const updated = await prisma.categoryRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
      include: { category: true },
    });

    revalidatePath("/categories");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle category rule:", error);
    return { success: false, error: "Failed to toggle category rule" };
  }
}

// Bulk create rules from default templates
export async function seedDefaultCategoryRules(): Promise<ActionResponse<number>> {
  try {
    const session = await requireAuth();

    // Check if user already has rules
    const existingCount = await prisma.categoryRule.count({
      where: { userId: session.user.id },
    });

    if (existingCount > 0) {
      return {
        success: false,
        error: "You already have category rules. Delete them first to reseed.",
      };
    }

    // Get all categories
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    // Default rules template
    const defaultRules = [
      { pattern: "AMAZON.COM SERVICES", categoryName: "Amazon Payout", priority: 100 },
      { pattern: "AMAZON EDI PAYMENTS", categoryName: "Amazon Payout", priority: 100 },
      { pattern: "ADP WAGE PAY", categoryName: "Driver Wages", priority: 90 },
      { pattern: "ADP Tax", categoryName: "Payroll Taxes", priority: 90 },
      { pattern: "ADP PAYROLL FEES", categoryName: "Admin/Overhead", priority: 90 },
      { pattern: "AMAZON INSURANCE", categoryName: "Insurance", priority: 90 },
      { pattern: "Wise Inc", categoryName: "Workers Comp", priority: 80 },
      { pattern: "OPENPHONE", categoryName: "Admin/Overhead", priority: 70 },
      { pattern: "QUO (OPENPHONE)", categoryName: "Admin/Overhead", priority: 70 },
      { pattern: "NAME-CHEAP", categoryName: "Admin/Overhead", priority: 70 },
      { pattern: "Monday.com", categoryName: "Admin/Overhead", priority: 70 },
      { pattern: "INDEED", categoryName: "Admin/Overhead", priority: 70 },
      { pattern: "MONTHLY SERVICE FEE", categoryName: "Bank Fees", priority: 80 },
      { pattern: "COUNTER CHECK", categoryName: "Bank Fees", priority: 80 },
      { pattern: "MARATHON", categoryName: "Fuel", priority: 60 },
      { pattern: "KWIK TRIP", categoryName: "Fuel", priority: 60 },
      { pattern: "BP#", categoryName: "Fuel", priority: 60 },
      { pattern: "SHELL OIL", categoryName: "Fuel", priority: 60 },
      { pattern: "HOLIDAY STATIONS", categoryName: "Fuel", priority: 60 },
      { pattern: "EXXON", categoryName: "Fuel", priority: 60 },
      { pattern: "O'REILLY", categoryName: "Maintenance", priority: 60 },
    ];

    const rulesToCreate = defaultRules
      .filter((rule) => categoryMap.has(rule.categoryName))
      .map((rule) => ({
        userId: session.user.id,
        categoryId: categoryMap.get(rule.categoryName)!,
        pattern: rule.pattern,
        matchType: "contains",
        field: "description",
        priority: rule.priority,
        isActive: true,
      }));

    await prisma.categoryRule.createMany({
      data: rulesToCreate,
    });

    revalidatePath("/categories");
    return { success: true, data: rulesToCreate.length };
  } catch (error) {
    console.error("Failed to seed default rules:", error);
    return { success: false, error: "Failed to seed default rules" };
  }
}
