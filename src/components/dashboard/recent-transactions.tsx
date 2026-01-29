"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Receipt } from "lucide-react";
import type { RecentTransaction } from "@/actions/dashboard/dashboard";
import { format } from "date-fns";

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
  loading?: boolean;
}

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

function formatDate(date: Date): string {
  const today = new Date();
  const txnDate = new Date(date);

  if (
    txnDate.getDate() === today.getDate() &&
    txnDate.getMonth() === today.getMonth() &&
    txnDate.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    txnDate.getDate() === yesterday.getDate() &&
    txnDate.getMonth() === yesterday.getMonth() &&
    txnDate.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  return format(txnDate, "MMM d");
}

function truncateDescription(description: string, maxLength: number = 30): string {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + "...";
}

export function RecentTransactions({ transactions, loading = false }: RecentTransactionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32 mt-1" />
          </div>
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasTransactions = transactions.length > 0;

  // Group transactions by date
  const groupedTransactions = transactions.reduce<Record<string, RecentTransaction[]>>(
    (acc, txn) => {
      const dateKey = formatDate(new Date(txn.postingDate));
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(txn);
      return acc;
    },
    {}
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest financial activity</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {hasTransactions ? (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
              <div key={dateLabel}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{dateLabel}</p>
                <div className="space-y-2">
                  {txns.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: txn.categoryColor
                              ? `${txn.categoryColor}20`
                              : "#f1f5f9",
                          }}
                        >
                          <Receipt
                            className="h-4 w-4"
                            style={{
                              color: txn.categoryColor || "#64748b",
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {truncateDescription(txn.description)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {txn.categoryName || "Uncategorized"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          txn.amount >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No transactions yet</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions">Import Transactions</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
