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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  getCategoryRules,
  deleteCategoryRule,
  toggleCategoryRuleActive,
  seedDefaultCategoryRules,
  type CategoryRuleWithCategory,
} from "@/actions/settings";
import { CategoryRuleForm } from "./category-rule-form";

export function CategoryRulesSection() {
  const queryClient = useQueryClient();
  const [editRule, setEditRule] = useState<CategoryRuleWithCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<CategoryRuleWithCategory | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);

  const { data: rulesResult, isLoading } = useQuery({
    queryKey: ["categoryRules"],
    queryFn: () => getCategoryRules(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryRule(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Rule deleted");
        queryClient.invalidateQueries({ queryKey: ["categoryRules"] });
      } else {
        toast.error(result.error || "Failed to delete rule");
      }
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete rule");
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleCategoryRuleActive(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.data?.isActive ? "Rule enabled" : "Rule disabled");
        queryClient.invalidateQueries({ queryKey: ["categoryRules"] });
      } else {
        toast.error(result.error || "Failed to toggle rule");
      }
    },
    onError: () => {
      toast.error("Failed to toggle rule");
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => seedDefaultCategoryRules(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Created ${result.data} default rules`);
        queryClient.invalidateQueries({ queryKey: ["categoryRules"] });
      } else {
        toast.error(result.error || "Failed to seed rules");
      }
    },
    onError: () => {
      toast.error("Failed to seed rules");
    },
  });

  const rules = rulesResult?.success ? rulesResult.data : [];

  const getMatchTypeBadge = (matchType: string) => {
    const labels: Record<string, string> = {
      contains: "Contains",
      startsWith: "Starts with",
      endsWith: "Ends with",
      regex: "Regex",
    };
    return (
      <Badge variant="outline" className="font-mono text-xs">
        {labels[matchType] || matchType}
      </Badge>
    );
  };

  const handleEdit = (rule: CategoryRuleWithCategory) => {
    setEditRule(rule);
    setFormOpen(true);
  };

  const handleDelete = (rule: CategoryRuleWithCategory) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditRule(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">
              Auto-Categorization Rules
            </CardTitle>
            <CardDescription>
              Rules for automatically categorizing transactions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {rules.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Load Defaults
              </Button>
            )}
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No rules yet. Add rules to auto-categorize transactions.</p>
              <p className="text-sm mt-1">
                Click &quot;Load Defaults&quot; to start with common patterns.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Hits</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-mono text-sm">
                        {rule.pattern}
                      </TableCell>
                      <TableCell>{getMatchTypeBadge(rule.matchType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: rule.category.color }}
                          />
                          <span className="text-sm">{rule.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {rule.hitCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleMutation.mutate(rule.id)}
                          disabled={toggleMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(rule)}
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

      {/* Rule Form Dialog */}
      <CategoryRuleForm open={formOpen} onClose={handleFormClose} rule={editRule} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rule for &quot;{ruleToDelete?.pattern}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ruleToDelete && deleteMutation.mutate(ruleToDelete.id)}
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
