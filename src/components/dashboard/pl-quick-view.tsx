"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PLQuickViewData } from "@/actions/dashboard/dashboard";

interface PLQuickViewProps {
  data: PLQuickViewData | null;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const plTiers = [
  { key: "netRevenue" as const, label: "Net Revenue", color: "text-blue-600" },
  { key: "grossProfit" as const, label: "Gross Profit", color: "text-emerald-600" },
  { key: "operatingIncome" as const, label: "Operating Income", color: "text-purple-600" },
] as const;

export function PLQuickView({ data, loading = false }: PLQuickViewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">P&L Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-3 mb-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No reconciled batches</p>
            <p className="text-xs text-muted-foreground">
              Reconcile a transaction batch to see P&L
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">P&L Summary</CardTitle>
          <Link
            href={`/transactions/${data.batchId}`}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {data.batchName}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plTiers.map((tier) => (
            <div key={tier.key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tier.label}</span>
              <span className={cn("text-sm font-semibold", tier.color)}>
                {formatCurrency(data[tier.key])}
              </span>
            </div>
          ))}

          {/* Operating Margin */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Operating Margin</span>
              <span
                className={cn(
                  "text-lg font-bold font-[family-name:var(--font-display)]",
                  data.operatingMargin >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {data.operatingMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-1">
            Based on {data.transactionCount} transactions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
