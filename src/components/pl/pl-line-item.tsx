"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Circle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getTransactionsByCategory, getTransactionsByCategoryInBatch, type CategoryTransaction } from "@/actions/transactions";
import type { PLLineItem } from "@/schema/transaction.schema";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PLLineItemRowProps {
  item: PLLineItem;
  isNegative?: boolean;
  startDate?: Date;
  endDate?: Date;
  transactionBatchId?: string;
}

export function PLLineItemRow({
  item,
  isNegative = false,
  startDate,
  endDate,
  transactionBatchId,
}: PLLineItemRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return (
      prefix +
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    );
  };

  // Fetch transactions when expanded — batch mode or date-range mode
  const { data: transactions, isLoading } = useQuery({
    queryKey: transactionBatchId
      ? ["category-transactions", "batch", item.categoryId, transactionBatchId]
      : ["category-transactions", item.categoryId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (transactionBatchId) {
        const result = await getTransactionsByCategoryInBatch(item.categoryId, transactionBatchId);
        if (!result.success) throw new Error(result.error || "Failed to fetch transactions");
        return result.data;
      }
      const result = await getTransactionsByCategory(item.categoryId, startDate!, endDate!);
      if (!result.success) throw new Error(result.error || "Failed to fetch transactions");
      return result.data;
    },
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between gap-2 py-2.5 px-2 -mx-2 rounded-md hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                isOpen && "rotate-180"
              )}
            />
            <Circle
              className="h-3 w-3 flex-shrink-0 hidden sm:block"
              style={{ fill: item.categoryColor, color: item.categoryColor }}
            />
            <div className="text-left min-w-0 flex-1">
              <span className="text-sm font-medium truncate block sm:inline">{item.categoryName}</span>
              <span className="text-xs text-slate-500 ml-0 sm:ml-2 block sm:inline">
                ({item.transactionCount})
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span
              className={cn(
                "text-sm font-mono font-medium",
                isNegative ? "text-red-600" : "text-green-600"
              )}
            >
              {formatCurrency(item.amount)}
            </span>
            <span className="text-xs text-slate-500 ml-1 sm:ml-2 hidden sm:inline">
              ({item.percentage.toFixed(1)}%)
            </span>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 sm:pl-10 pr-2 pb-3 pt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading...</span>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <TransactionRow key={txn.id} transaction={txn} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-2">No transactions found</div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TransactionRow({ transaction }: { transaction: CategoryTransaction }) {
  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return (
      prefix +
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    );
  };

  // Check if description is long enough to need tooltip
  const needsTooltip = transaction.description.length > 60;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 py-3 px-3 bg-white border border-slate-100 rounded-lg text-sm">
      {/* Left side: Description and metadata */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Description with tooltip */}
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <p
                className={cn(
                  "font-medium text-slate-800 cursor-default",
                  "line-clamp-2 sm:line-clamp-1"
                )}
              >
                {transaction.description}
              </p>
            </TooltipTrigger>
            {needsTooltip && (
              <TooltipContent
                side="top"
                align="start"
                className="max-w-md p-3 text-sm break-words"
              >
                {transaction.description}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
          <span className="whitespace-nowrap">
            {format(new Date(transaction.postingDate), "MMM d, yyyy")}
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 whitespace-nowrap">
            {transaction.type.replace(/_/g, " ")}
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 whitespace-nowrap">
            {transaction.details}
          </span>
        </div>
      </div>

      {/* Right side: Amount */}
      <div
        className={cn(
          "font-mono font-semibold whitespace-nowrap text-base sm:text-sm self-end sm:self-start",
          transaction.amount >= 0 ? "text-green-600" : "text-red-600"
        )}
      >
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
}
