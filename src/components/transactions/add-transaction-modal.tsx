"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "./category-select";
import type { Category } from "@/lib/generated/prisma/client";
import type { CreateTransactionInput } from "@/schema/transaction.schema";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTransactionInput) => void;
  categories: Category[];
  categoriesLoading?: boolean;
  isSubmitting?: boolean;
}

const DETAILS_OPTIONS = [
  { value: "DEBIT", label: "Debit" },
  { value: "CREDIT", label: "Credit" },
  { value: "CHECK", label: "Check" },
  { value: "DSLIP", label: "Deposit Slip" },
];

const TYPE_OPTIONS = [
  { value: "ACH_DEBIT", label: "ACH Debit" },
  { value: "ACH_CREDIT", label: "ACH Credit" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "WIRE_TRANSFER", label: "Wire Transfer" },
  { value: "CHECK", label: "Check" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

export function AddTransactionModal({
  open,
  onOpenChange,
  onSubmit,
  categories,
  categoriesLoading = false,
  isSubmitting = false,
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    details: "DEBIT",
    postingDate: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "ACH_DEBIT",
    balance: "",
    checkOrSlipNum: "",
    categoryId: null as string | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      details: "DEBIT",
      postingDate: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      type: "ACH_DEBIT",
      balance: "",
      checkOrSlipNum: "",
      categoryId: null,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.postingDate) {
      newErrors.postingDate = "Date is required";
    }
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      newErrors.amount = "Valid amount is required";
    }
    if (!formData.details) {
      newErrors.details = "Details is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      details: formData.details,
      postingDate: new Date(formData.postingDate),
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      balance: formData.balance ? parseFloat(formData.balance) : null,
      checkOrSlipNum: formData.checkOrSlipNum || null,
      categoryId: formData.categoryId,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Manually add a new transaction to your records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="postingDate">Date *</Label>
            <Input
              id="postingDate"
              type="date"
              value={formData.postingDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, postingDate: e.target.value }))
              }
            />
            {errors.postingDate && (
              <p className="text-sm text-destructive">{errors.postingDate}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="e.g., Payment from Amazon Relay"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use positive for credits (income), negative for debits (expenses)
            </p>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Details & Type in a row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Details */}
            <div className="space-y-2">
              <Label htmlFor="details">Details *</Label>
              <Select
                value={formData.details}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, details: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DETAILS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.details && (
                <p className="text-sm text-destructive">{errors.details}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelect
              value={formData.categoryId}
              onValueChange={(categoryId) =>
                setFormData((prev) => ({ ...prev, categoryId }))
              }
              categories={categories}
              loading={categoriesLoading}
              placeholder="Select category (optional)"
              className="w-full"
            />
          </div>

          {/* Optional: Balance */}
          <div className="space-y-2">
            <Label htmlFor="balance">Balance After (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, balance: e.target.value }))
                }
                className="pl-7"
                placeholder="Account balance after transaction"
              />
            </div>
          </div>

          {/* Optional: Check/Slip Number */}
          <div className="space-y-2">
            <Label htmlFor="checkOrSlipNum">Check/Slip Number (optional)</Label>
            <Input
              id="checkOrSlipNum"
              value={formData.checkOrSlipNum}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  checkOrSlipNum: e.target.value,
                }))
              }
              placeholder="e.g., 1234"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
