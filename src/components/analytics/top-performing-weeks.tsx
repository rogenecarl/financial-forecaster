"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopPerformingBatch {
  id: string;
  name: string;
  createdAt: Date;
  actual: number;
  projected: number;
  tripCount: number;
  loadCount: number;
  accuracy: number;
}

interface TopPerformingBatchesProps {
  data: TopPerformingBatch[];
  year: number;
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

const rankIcons = [
  { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-50" },
  { icon: Award, color: "text-amber-700", bg: "bg-amber-50/50" },
  { icon: Star, color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Star, color: "text-blue-400", bg: "bg-blue-50/50" },
];

export function TopPerformingBatches({ data, year, loading = false }: TopPerformingBatchesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-52" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Performing Batches
        </CardTitle>
        <CardDescription>
          Best revenue batches in {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {data.map((batch, index) => {
              const rankInfo = rankIcons[index] || rankIcons[4];
              const RankIcon = rankInfo.icon;
              const variance = batch.actual - batch.projected;
              const variancePercent = batch.projected > 0
                ? (variance / batch.projected) * 100
                : 0;

              return (
                <div
                  key={batch.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    index === 0 ? "bg-amber-50/50 border border-amber-200" : "hover:bg-muted/50"
                  )}
                >
                  {/* Rank Icon */}
                  <div className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full",
                    rankInfo.bg
                  )}>
                    <RankIcon className={cn("h-5 w-5", rankInfo.color)} />
                  </div>

                  {/* Batch Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {batch.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{batch.tripCount} trips</span>
                      <span>•</span>
                      <span>{batch.loadCount} loads</span>
                      <span>•</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1",
                          batch.accuracy >= 95
                            ? "border-emerald-500 text-emerald-600"
                            : batch.accuracy >= 90
                            ? "border-blue-500 text-blue-600"
                            : "border-amber-500 text-amber-600"
                        )}
                      >
                        {batch.accuracy.toFixed(0)}% acc
                      </Badge>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(batch.actual)}
                    </p>
                    <p className={cn(
                      "text-xs",
                      variance >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {variance >= 0 ? "+" : ""}
                      {variancePercent.toFixed(1)}% vs proj
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No completed batches yet</p>
            <p className="text-xs text-muted-foreground">
              Complete batches with actual revenue to see top performers
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
