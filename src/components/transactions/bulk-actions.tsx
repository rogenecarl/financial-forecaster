"use client";

import { useState } from "react";
import { X, Tag, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySelect } from "./category-select";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkCategorize: (categoryId: string, createRule: boolean, rulePattern?: string) => void;
  onBulkDelete: () => void;
  sampleDescription?: string;
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  onBulkCategorize,
  onBulkDelete,
  sampleDescription,
}: BulkActionsProps) {
  const [showCategorizeDialog, setShowCategorizeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [createRule, setCreateRule] = useState(false);
  const [rulePattern, setRulePattern] = useState("");

  if (selectedCount === 0) return null;

  const handleCategorize = () => {
    if (categoryId) {
      onBulkCategorize(categoryId, createRule, createRule ? rulePattern : undefined);
      setShowCategorizeDialog(false);
      setCategoryId(null);
      setCreateRule(false);
      setRulePattern("");
    }
  };

  const handleDelete = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
  };

  // Extract potential rule pattern from sample description
  const suggestPattern = () => {
    if (!sampleDescription) return "";
    // Try to extract meaningful pattern (first few words or known vendor)
    const words = sampleDescription.split(/\s+/);
    // Return first 3 words or until a number is encountered
    const pattern: string[] = [];
    for (const word of words.slice(0, 3)) {
      if (/^\d/.test(word)) break;
      pattern.push(word);
    }
    return pattern.join(" ");
  };

  return (
    <>
      {/* Floating action bar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "bg-slate-900 text-white rounded-lg shadow-lg",
          "flex items-center gap-4 px-4 py-3"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-xs font-medium">
            {selectedCount}
          </div>
          <span className="text-sm">
            {selectedCount === 1 ? "transaction" : "transactions"} selected
          </span>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-slate-800"
            onClick={() => {
              setRulePattern(suggestPattern());
              setShowCategorizeDialog(true);
            }}
          >
            <Tag className="h-4 w-4 mr-2" />
            Categorize
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-slate-800 hover:text-red-300"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-400 hover:bg-slate-800 hover:text-white"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Categorize dialog */}
      <Dialog open={showCategorizeDialog} onOpenChange={setShowCategorizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorize {selectedCount} Transactions</DialogTitle>
            <DialogDescription>
              Select a category to apply to the selected transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <CategorySelect
                value={categoryId}
                onValueChange={setCategoryId}
                showUncategorized={false}
                className="w-full"
              />
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="create-rule"
                  checked={createRule}
                  onCheckedChange={(checked) => setCreateRule(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="create-rule" className="cursor-pointer">
                    Create a categorization rule
                  </Label>
                  <p className="text-xs text-slate-500">
                    Automatically categorize future transactions matching this pattern
                  </p>
                </div>
              </div>

              {createRule && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="pattern">Pattern to match</Label>
                  <Input
                    id="pattern"
                    value={rulePattern}
                    onChange={(e) => setRulePattern(e.target.value)}
                    placeholder="e.g., AMAZON.COM SERVICES"
                  />
                  <p className="text-xs text-slate-500">
                    Transactions containing this text will be auto-categorized
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCategorizeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCategorize} disabled={!categoryId}>
              <Check className="h-4 w-4 mr-2" />
              Apply Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Transactions?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected transactions will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedCount} Transactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
