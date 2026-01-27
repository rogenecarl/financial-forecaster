"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createCategorySchema, type CategoryFormData } from "@/schema/settings.schema";
import { createCategory, updateCategory } from "@/actions/settings";
import type { Category } from "@/lib/generated/prisma/client";

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#64748b", // slate
];

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryForm({ open, onClose, category }: CategoryFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: "EXPENSE",
      color: "#6b7280",
      icon: "",
      description: "",
      includeInPL: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon || "",
        description: category.description || "",
        includeInPL: category.includeInPL,
        sortOrder: category.sortOrder,
      });
    } else {
      form.reset({
        name: "",
        type: "EXPENSE",
        color: "#6b7280",
        icon: "",
        description: "",
        includeInPL: true,
        sortOrder: 0,
      });
    }
  }, [category, form]);

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      if (isEditing && category) {
        return updateCategory({ id: category.id, ...data });
      }
      return createCategory(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(isEditing ? "Category updated" : "Category created");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        onClose();
      } else {
        toast.error(result.error || "Failed to save category");
      }
    },
    onError: () => {
      toast.error("Failed to save category");
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details below."
              : "Create a new category for transaction classification."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Office Supplies"
                      {...field}
                      disabled={category?.isSystem}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="REVENUE">Revenue</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="UNKNOWN">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`h-6 w-6 rounded-full border-2 transition-all ${
                              field.value === color
                                ? "border-primary scale-110"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="h-9 w-14 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="#6b7280"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this category"
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeInPL"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Include in P&L</FormLabel>
                    <FormDescription className="text-xs">
                      Include transactions in Profit & Loss statements
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
