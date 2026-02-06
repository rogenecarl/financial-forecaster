"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { useCategories, useDeleteCategory } from "@/hooks";
import { CategoryForm } from "./category-form";
import type { Category } from "@/lib/generated/prisma/client";

type CategoryType = "REVENUE" | "CONTRA_REVENUE" | "COGS" | "OPERATING_EXPENSE" | "EQUITY" | "UNCATEGORIZED";

const TYPE_LABELS: Record<CategoryType, string> = {
  REVENUE: "Revenue",
  CONTRA_REVENUE: "Contra-Revenue (Refunds)",
  COGS: "Cost of Goods Sold",
  OPERATING_EXPENSE: "Operating Expenses",
  EQUITY: "Equity (Not in P&L)",
  UNCATEGORIZED: "Uncategorized",
};

const TYPE_ORDER: CategoryType[] = ["REVENUE", "CONTRA_REVENUE", "COGS", "OPERATING_EXPENSE", "EQUITY", "UNCATEGORIZED"];

export function CategoriesSection() {
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { categories, isLoading } = useCategories();
  const { deleteCategory: deleteCategoryMutation, isPending: isDeleting } = useDeleteCategory();

  // Group categories by type
  const groupedCategories = TYPE_ORDER.reduce(
    (acc, type) => {
      acc[type] = categories.filter((c) => c.type === type);
      return acc;
    },
    {} as Record<CategoryType, Category[]>
  );

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditCategory(null);
  };

  const renderCategoryRow = (category: Category, isLast: boolean) => {
    // EQUITY and UNCATEGORIZED types are excluded from P&L
    const isExcludedFromPL = category.type === "EQUITY" || category.type === "UNCATEGORIZED";

    return (
      <div
        key={category.id}
        className={`flex items-center justify-between py-2 px-3 ${
          !isLast ? "border-b border-border/50" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Tree connector */}
          <span className="text-muted-foreground text-sm w-4">
            {isLast ? "└" : "├"}
          </span>
          {/* Color indicator */}
          <div
            className="h-3.5 w-3.5 rounded-full border border-border/50"
            style={{ backgroundColor: category.color }}
          />
          {/* Name */}
          <span className="text-sm font-medium">{category.name}</span>
          {/* System badge */}
          {category.isSystem && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              System
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* P&L status */}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {isExcludedFromPL ? (
              <>
                <X className="h-3 w-3 text-muted-foreground" />
                <span>Not in P&L</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span>In P&L</span>
              </>
            )}
          </span>
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(category)}
                disabled={category.isSystem}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">
              Transaction Categories
            </CardTitle>
            <CardDescription>
              Manage categories for bookkeeping and P&L generation
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Add your first category.
            </div>
          ) : (
            <div className="rounded-lg border divide-y">
              {TYPE_ORDER.map((type) => {
                const typedCategories = groupedCategories[type];
                if (typedCategories.length === 0) return null;

                return (
                  <div key={type} className="py-3">
                    {/* Section header */}
                    <div className="px-3 pb-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {TYPE_LABELS[type]}
                      </h3>
                    </div>
                    {/* Category list */}
                    <div>
                      {typedCategories.map((category, index) =>
                        renderCategoryRow(
                          category,
                          index === typedCategories.length - 1
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <CategoryForm
        open={formOpen}
        onClose={handleFormClose}
        category={editCategory}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?
              This action cannot be undone. Any transactions using this category
              will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation(categoryToDelete.id);
                  setDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
