"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, TrendingUp, FileCheck, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RevenuePipelineData } from "@/actions/dashboard/dashboard";

interface RevenuePipelineProps {
  data: RevenuePipelineData | null;
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

const stages = [
  {
    key: "projected" as const,
    label: "Projected",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-t-blue-500",
    batchLabel: "active batches",
  },
  {
    key: "invoiced" as const,
    label: "Invoiced",
    icon: FileCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-t-amber-500",
    batchLabel: "invoiced batches",
  },
  {
    key: "deposited" as const,
    label: "Deposited",
    icon: Landmark,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-t-emerald-500",
    batchLabel: "reconciled batches",
  },
] as const;

export function RevenuePipeline({ data, loading = false }: RevenuePipelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className="flex-1 rounded-lg border p-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                {i < 2 && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/30" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data && (data.projected > 0 || data.invoiced > 0 || data.deposited > 0);

  const batchCounts = data
    ? {
        projected: data.projectedBatchCount,
        invoiced: data.invoicedBatchCount,
        deposited: data.depositedBatchCount,
      }
    : { projected: 0, invoiced: 0, deposited: 0 };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Revenue Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex items-stretch gap-2">
            {stages.map((stage, i) => {
              const Icon = stage.icon;
              const value = data?.[stage.key] ?? 0;
              const count = batchCounts[stage.key];

              return (
                <div key={stage.key} className="flex-1 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex-1 rounded-lg border border-t-3 p-4",
                      stage.borderColor
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("rounded-md p-1.5", stage.bgColor)}>
                        <Icon className={cn("h-3.5 w-3.5", stage.color)} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-xl font-bold font-[family-name:var(--font-display)]">
                      {formatCurrency(value)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count} {stage.batchLabel}
                    </p>
                  </div>
                  {i < stages.length - 1 && (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-5 w-5" />
              <ChevronRight className="h-4 w-4" />
              <FileCheck className="h-5 w-5" />
              <ChevronRight className="h-4 w-4" />
              <Landmark className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">No pipeline data yet</p>
            <p className="text-xs text-muted-foreground">
              Create trip batches to start tracking revenue flow
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
