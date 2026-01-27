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

    // Check for duplicate name
    const existing = await prisma.category.findUnique({
      where: { name: validatedData.data.name },
    });

    if (existing) {
      return { success: false, error: "A category with this name already exists" };
    }

    const category = await prisma.category.create({
      data: {
        name: validatedData.data.name,
        type: validatedData.data.type,
        color: validatedData.data.color,
        icon: validatedData.data.icon,
        description: validatedData.data.description,
        includeInPL: validatedData.data.includeInPL,
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

    // Check for duplicate name if name is being changed
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: updateData.name },
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
