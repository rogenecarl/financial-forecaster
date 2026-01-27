"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import {
  createCategoryRuleSchema,
  type CategoryRuleFormData,
} from "@/schema/settings.schema";
import {
  createCategoryRule,
  updateCategoryRule,
  getCategories,
  type CategoryRuleWithCategory,
} from "@/actions/settings";

interface CategoryRuleFormProps {
  open: boolean;
  onClose: () => void;
  rule?: CategoryRuleWithCategory | null;
}

export function CategoryRuleForm({ open, onClose, rule }: CategoryRuleFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!rule;

  const { data: categoriesResult } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const categories = categoriesResult?.success ? categoriesResult.data : [];

  const form = useForm<CategoryRuleFormData>({
    resolver: zodResolver(createCategoryRuleSchema),
    defaultValues: {
      categoryId: "",
      pattern: "",
      matchType: "contains",
      field: "description",
      priority: 50,
      isActive: true,
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        categoryId: rule.categoryId,
        pattern: rule.pattern,
        matchType: rule.matchType as "contains" | "startsWith" | "endsWith" | "regex",
        field: rule.field as "description" | "type" | "details",
        priority: rule.priority,
        isActive: rule.isActive,
      });
    } else {
      form.reset({
        categoryId: "",
        pattern: "",
        matchType: "contains",
        field: "description",
        priority: 50,
        isActive: true,
      });
    }
  }, [rule, form]);

  const mutation = useMutation({
    mutationFn: (data: CategoryRuleFormData) => {
      if (isEditing && rule) {
        return updateCategoryRule({ id: rule.id, ...data });
      }
      return createCategoryRule(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(isEditing ? "Rule updated" : "Rule created");
        queryClient.invalidateQueries({ queryKey: ["categoryRules"] });
        onClose();
      } else {
        toast.error(result.error || "Failed to save rule");
      }
    },
    onError: () => {
      toast.error("Failed to save rule");
    },
  });

  const onSubmit = (data: CategoryRuleFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Add Rule"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the categorization rule details."
              : "Create a new rule for auto-categorizing transactions."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AMAZON.COM SERVICES" {...field} />
                  </FormControl>
                  <FormDescription>
                    The text pattern to match in transaction descriptions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select match type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="startsWith">Starts with</SelectItem>
                        <SelectItem value="endsWith">Ends with</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="details">Details</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority ({field.value})</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher priority rules are checked first (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Active</FormLabel>
                    <FormDescription className="text-xs">
                      Enable this rule for auto-categorization
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
