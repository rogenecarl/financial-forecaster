"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface VarianceSummaryCardsProps {
  totalProjected: number;
  totalActual: number | null;
  variance: number | null;
  variancePercent: number | null;
  avgAccuracy: number | null;
  loading?: boolean;
}

export function VarianceSummaryCards({
  totalProjected,
  totalActual,
  variance,
  variancePercent,
  avgAccuracy,
  loading = false,
}: VarianceSummaryCardsProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total Projected */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                Total Projected
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {formatCurrency(totalProjected)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Actual */}
      <Card
        className={cn(
          "bg-gradient-to-br border",
          totalActual !== null
            ? variance !== null && variance >= 0
              ? "from-emerald-50 to-emerald-100/50 border-emerald-200"
              : "from-amber-50 to-amber-100/50 border-amber-200"
            : "from-slate-50 to-slate-100/50 border-slate-200"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p
                className={cn(
                  "text-sm font-medium flex items-center gap-1.5",
                  totalActual !== null
                    ? variance !== null && variance >= 0
                      ? "text-emerald-700"
                      : "text-amber-700"
                    : "text-slate-700"
                )}
              >
                <DollarSign className="h-4 w-4" />
                Total Actual
              </p>
              <p
                className={cn(
                  "text-3xl font-bold mt-1",
                  totalActual !== null
                    ? variance !== null && variance >= 0
                      ? "text-emerald-900"
                      : "text-amber-900"
                    : "text-slate-400"
                )}
              >
                {formatCurrency(totalActual)}
              </p>
              {variance !== null && (
                <div
                  className={cn(
                    "flex items-center gap-1 mt-1 text-sm font-medium",
                    variance >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {variance >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {variance >= 0 ? "+" : ""}
                    {formatCurrency(variance)}
                    {variancePercent !== null && ` (${variancePercent >= 0 ? "+" : ""}${variancePercent.toFixed(1)}%)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Accuracy */}
      <Card
        className={cn(
          "bg-gradient-to-br border",
          avgAccuracy !== null
            ? avgAccuracy >= 95
              ? "from-emerald-50 to-emerald-100/50 border-emerald-200"
              : avgAccuracy >= 90
              ? "from-blue-50 to-blue-100/50 border-blue-200"
              : "from-amber-50 to-amber-100/50 border-amber-200"
            : "from-slate-50 to-slate-100/50 border-slate-200"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium flex items-center gap-1.5",
                  avgAccuracy !== null
                    ? avgAccuracy >= 95
                      ? "text-emerald-700"
                      : avgAccuracy >= 90
                      ? "text-blue-700"
                      : "text-amber-700"
                    : "text-slate-700"
                )}
              >
                <Percent className="h-4 w-4" />
                Avg Accuracy
              </p>
              <p
                className={cn(
                  "text-3xl font-bold mt-1",
                  avgAccuracy !== null
                    ? avgAccuracy >= 95
                      ? "text-emerald-900"
                      : avgAccuracy >= 90
                      ? "text-blue-900"
                      : "text-amber-900"
                    : "text-slate-400"
                )}
              >
                {avgAccuracy !== null ? `${avgAccuracy.toFixed(1)}%` : "-"}
              </p>
              {avgAccuracy !== null && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      avgAccuracy >= 95
                        ? "bg-emerald-500"
                        : avgAccuracy >= 90
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(100, avgAccuracy)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
