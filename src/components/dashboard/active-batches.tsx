"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Truck, Receipt, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveBatchItem } from "@/actions/dashboard/dashboard";

interface ActiveBatchesProps {
  data: ActiveBatchItem[];
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

export function ActiveBatches({ data, loading = false }: ActiveBatchesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const tripBatches = data.filter((b) => b.type === "trip");
  const txnBatches = data.filter((b) => b.type === "transaction");
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Needs Attention
          {hasData && (
            <Badge variant="secondary" className="text-xs font-normal">
              {data.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Trip Batches */}
            {tripBatches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="h-3 w-3" />
                  Trip Batches
                </p>
                {tripBatches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/trips/${batch.id}`}
                    className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="rounded-md p-2 bg-blue-50">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{batch.name}</p>
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {batch.actionNeeded}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(batch.total)}</p>
                      <p className="text-xs text-muted-foreground">{batch.itemCount} trips</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            {/* Transaction Batches */}
            {txnBatches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Receipt className="h-3 w-3" />
                  Transaction Batches
                </p>
                {txnBatches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/transactions/${batch.id}`}
                    className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="rounded-md p-2 bg-amber-50">
                      <Receipt className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{batch.name}</p>
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {batch.actionNeeded}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{formatCurrency(batch.total)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center py-8",
            "border-2 border-dashed border-border rounded-lg"
          )}>
            <div className="rounded-full bg-emerald-50 p-3 mb-3">
              <AlertCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-600">All caught up!</p>
            <p className="text-xs text-muted-foreground">No batches need attention</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
