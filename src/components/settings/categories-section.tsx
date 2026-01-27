"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getCategories, deleteCategory } from "@/actions/settings";
import { CategoryForm } from "./category-form";
import type { Category } from "@/lib/generated/prisma/client";

export function CategoriesSection() {
  const queryClient = useQueryClient();
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: categoriesResult, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Category deleted");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        toast.error(result.error || "Failed to delete category");
      }
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete category");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
  });

  const categories = categoriesResult?.success ? categoriesResult.data : [];

  const getCategoryTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      REVENUE: "default",
      EXPENSE: "destructive",
      TRANSFER: "secondary",
      UNKNOWN: "outline",
    };
    return (
      <Badge variant={variants[type] || "outline"} className="font-normal">
        {type.charAt(0) + type.slice(1).toLowerCase()}
      </Badge>
    );
  };

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Categories</CardTitle>
            <CardDescription>
              Manage transaction categories for bookkeeping
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
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">In P&L</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                        {category.isSystem && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryTypeBadge(category.type)}</TableCell>
                      <TableCell className="text-center">
                        {category.includeInPL ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              This action cannot be undone. Any associated rules will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
