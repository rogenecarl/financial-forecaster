"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionBatchStatusBadge } from "./transaction-batch-status-badge";
import {
  Receipt,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionBatchSummary } from "@/actions/transactions/transaction-batches";

interface TransactionBatchCardProps {
  batch: TransactionBatchSummary;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TransactionBatchCard({
  batch,
  onClick,
  onEdit,
  onDelete,
}: TransactionBatchCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer border-l-4",
        batch.status === "EMPTY" && "border-l-slate-300",
        batch.status === "ACTIVE" && "border-l-blue-400",
        batch.status === "RECONCILED" && "border-l-emerald-400"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold truncate">
              {batch.name}
            </CardTitle>
            {batch.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {batch.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TransactionBatchStatusBadge status={batch.status} size="sm" />
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Batch
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Batch
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span>
              <span className="font-medium text-foreground">
                {batch.transactionCount}
              </span>{" "}
              txns
            </span>
          </div>
          {batch.uncategorizedCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                <span className="font-medium">{batch.uncategorizedCount}</span>{" "}
                uncategorized
              </span>
            </div>
          )}
          <div className="ml-auto font-semibold text-emerald-700">
            {formatCurrency(batch.netRevenue)}
          </div>
        </div>

        {/* Financial metrics row */}
        {batch.transactionCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                GP: <span className="font-medium text-foreground">{formatCurrency(batch.grossProfit)}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>
                OI: <span className="font-medium text-foreground">{formatCurrency(batch.operatingIncome)}</span>
              </span>
            </div>
            {batch.operatingMargin !== 0 && (
              <span className={cn(
                "text-xs font-medium",
                batch.operatingMargin >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {batch.operatingMargin >= 0 ? "+" : ""}
                {batch.operatingMargin.toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {/* Dates row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Created {format(new Date(batch.createdAt), "MMM d, yyyy")}
          </span>
          {batch.lastImportedAt && (
            <span>
              Imported {format(new Date(batch.lastImportedAt), "MMM d")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
