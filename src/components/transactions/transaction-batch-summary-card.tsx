"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionBatchSummary } from "@/actions/transactions/transaction-batches";

interface TransactionBatchSummaryCardProps {
  batch: TransactionBatchSummary | null;
  loading?: boolean;
}

export function TransactionBatchSummaryCard({
  batch,
  loading = false,
}: TransactionBatchSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-muted/60 to-muted/30 p-6">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-7 w-36 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!batch) return null;

  const metrics = [
    {
      icon: Receipt,
      label: "Transactions",
      value: batch.transactionCount.toString(),
      sub: batch.lastImportFileName
        ? `from ${batch.lastImportFileName}`
        : "none imported",
      subColor: "text-muted-foreground",
    },
    {
      icon: AlertCircle,
      label: "Uncategorized",
      value: batch.uncategorizedCount.toString(),
      sub:
        batch.transactionCount > 0
          ? `${Math.round(((batch.transactionCount - batch.uncategorizedCount) / batch.transactionCount) * 100)}% categorized`
          : "no transactions",
      subColor:
        batch.uncategorizedCount > 0
          ? "text-amber-500"
          : "text-emerald-500",
    },
    {
      icon: DollarSign,
      label: "Net Revenue",
      value: formatCurrency(batch.netRevenue),
      sub: "revenue - contra",
      subColor: "text-muted-foreground",
      valueColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      icon: TrendingUp,
      label: "Gross Profit",
      value: formatCurrency(batch.grossProfit),
      sub: "net rev - COGS",
      subColor: "text-muted-foreground",
      valueColor: batch.grossProfit >= 0
        ? "text-blue-700 dark:text-blue-400"
        : "text-red-600 dark:text-red-400",
    },
    {
      icon: Percent,
      label: "Operating Income",
      value: formatCurrency(batch.operatingIncome),
      sub: batch.operatingMargin !== 0
        ? `${batch.operatingMargin >= 0 ? "+" : ""}${batch.operatingMargin.toFixed(1)}% margin`
        : "margin",
      subColor: batch.operatingIncome >= 0
        ? "text-emerald-500"
        : "text-red-500",
      valueColor: batch.operatingIncome >= 0
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-muted/60 to-muted/30 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Financial Summary
          </h3>
          {batch.status === "RECONCILED" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              All Categorized
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-wider font-medium">
                    {metric.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-2xl md:text-3xl font-bold tracking-tight tabular-nums",
                    metric.valueColor || "text-foreground"
                  )}
                >
                  {metric.value}
                </div>
                {metric.sub && (
                  <p
                    className={cn(
                      "text-xs",
                      metric.subColor || "text-muted-foreground"
                    )}
                  >
                    {metric.sub}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
