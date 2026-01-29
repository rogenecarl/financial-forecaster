"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "./category-select";
import type { TransactionFilter } from "@/schema/transaction.schema";
import type { Category } from "@/lib/generated/prisma/client";

interface TransactionFiltersProps {
  filters: Partial<TransactionFilter>;
  onFiltersChange: (filters: Partial<TransactionFilter>) => void;
  onSearch: (search: string) => void;
  categories: Category[];
  categoriesLoading?: boolean;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  onSearch,
  categories,
  categoriesLoading = false,
}: TransactionFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Count active filters (excluding search and pagination)
  const activeFilterCount = [
    filters.categoryId,
    filters.type,
    filters.details,
    filters.reviewStatus,
    filters.dateFrom,
    filters.dateTo,
    filters.uncategorizedOnly,
  ].filter(Boolean).length;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({
      page: 1,
      limit: filters.limit || 50,
      sortBy: filters.sortBy || "postingDate",
      sortOrder: filters.sortOrder || "desc",
    });
  };

  const updateFilter = <K extends keyof TransactionFilter>(
    key: K,
    value: TransactionFilter[K] | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page on filter change
    });
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search transactions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <Select
          value={filters.reviewStatus || "all"}
          onValueChange={(value) =>
            updateFilter(
              "reviewStatus",
              value === "all" ? undefined : (value as TransactionFilter["reviewStatus"])
            )
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Category filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <CategorySelect
                  value={filters.categoryId || null}
                  onValueChange={(value) => updateFilter("categoryId", value || undefined)}
                  categories={categories}
                  loading={categoriesLoading}
                  className="w-full"
                />
              </div>

              {/* Type filter */}
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) =>
                    updateFilter("type", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ACH_CREDIT">ACH Credit</SelectItem>
                    <SelectItem value="ACH_DEBIT">ACH Debit</SelectItem>
                    <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                    <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
                    <SelectItem value="FEE">Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Details filter */}
              <div className="space-y-2">
                <Label>Details</Label>
                <Select
                  value={filters.details || "all"}
                  onValueChange={(value) =>
                    updateFilter("details", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                    <SelectItem value="DEBIT">Debit</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                    <SelectItem value="DSLIP">Deposit Slip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={
                      filters.dateFrom
                        ? new Date(filters.dateFrom).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateFilter(
                        "dateFrom",
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={
                      filters.dateTo
                        ? new Date(filters.dateTo).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      updateFilter(
                        "dateTo",
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              </div>

              {/* Uncategorized only */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="uncategorized"
                  checked={filters.uncategorizedOnly || false}
                  onChange={(e) =>
                    updateFilter(
                      "uncategorizedOnly",
                      e.target.checked || undefined
                    )
                  }
                  className="rounded border-slate-300"
                />
                <Label htmlFor="uncategorized" className="font-normal cursor-pointer">
                  Show uncategorized only
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.uncategorizedOnly && (
            <Badge variant="secondary" className="gap-1">
              Uncategorized
              <button onClick={() => updateFilter("uncategorizedOnly", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {new Date(filters.dateFrom).toLocaleDateString()}
              <button onClick={() => updateFilter("dateFrom", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {new Date(filters.dateTo).toLocaleDateString()}
              <button onClick={() => updateFilter("dateTo", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
