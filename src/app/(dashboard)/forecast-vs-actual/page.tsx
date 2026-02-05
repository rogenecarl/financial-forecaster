"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  Filter,
  Truck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTripBatches, type TripBatchSummary } from "@/actions/forecasting/trip-batches";
import { forecastingKeys } from "@/hooks";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "INVOICED";

export default function ForecastVsActualPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("INVOICED");

  // Fetch all batches
  const { data: batches = [], isLoading } = useQuery({
    queryKey: [...forecastingKeys.tripBatchesList(), { status: statusFilter === "all" ? undefined : statusFilter }],
    queryFn: async () => {
      const result = await getTripBatches(
        statusFilter === "all" ? undefined : { status: "INVOICED" }
      );
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Calculate aggregate stats for invoiced batches
  const aggregateStats = useMemo(() => {
    const invoicedBatches = batches.filter((b) => b.status === "INVOICED");

    if (invoicedBatches.length === 0) {
      return null;
    }

    const totalProjected = invoicedBatches.reduce(
      (sum, b) => sum + b.projectedTotal,
      0
    );
    const totalActual = invoicedBatches.reduce(
      (sum, b) => sum + (b.actualTotal ?? 0),
      0
    );
    const totalVariance = totalActual - totalProjected;
    const variancePercent =
      totalProjected > 0 ? (totalVariance / totalProjected) * 100 : 0;

    const totalProjectedTours = invoicedBatches.reduce(
      (sum, b) => sum + b.projectedTours,
      0
    );
    const totalActualTours = invoicedBatches.reduce(
      (sum, b) => sum + (b.actualTours ?? 0),
      0
    );

    const totalProjectedLoads = invoicedBatches.reduce(
      (sum, b) => sum + b.projectedLoads,
      0
    );
    const totalActualLoads = invoicedBatches.reduce(
      (sum, b) => sum + (b.actualLoads ?? 0),
      0
    );

    return {
      batchCount: invoicedBatches.length,
      totalProjected,
      totalActual,
      totalVariance,
      variancePercent,
      totalProjectedTours,
      totalActualTours,
      totalProjectedLoads,
      totalActualLoads,
    };
  }, [batches]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Filter batches based on status
  const displayBatches = useMemo(() => {
    if (statusFilter === "INVOICED") {
      return batches.filter((b) => b.status === "INVOICED");
    }
    return batches;
  }, [batches, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Forecast vs Actual
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare batch projections with actual invoice payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FilterStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INVOICED">Invoiced Batches</SelectItem>
              <SelectItem value="all">All Batches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : aggregateStats ? (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projected
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(aggregateStats.totalProjected)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {aggregateStats.totalProjectedTours} tours /{" "}
                  {aggregateStats.totalProjectedLoads} loads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Actual
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(aggregateStats.totalActual)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {aggregateStats.totalActualTours} tours /{" "}
                  {aggregateStats.totalActualLoads} loads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Variance</CardTitle>
                {aggregateStats.totalVariance >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    aggregateStats.totalVariance >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  )}
                >
                  {aggregateStats.totalVariance >= 0 ? "+" : ""}
                  {formatCurrency(aggregateStats.totalVariance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {aggregateStats.batchCount} invoiced batches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Variance %
                </CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    aggregateStats.variancePercent >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  )}
                >
                  {formatPercent(aggregateStats.variancePercent)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Batch Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Comparison</CardTitle>
              <CardDescription>
                Detailed breakdown by batch showing projected vs actual values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Batch</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                      <th className="pb-3 font-medium text-right">Projected</th>
                      <th className="pb-3 font-medium text-right">Actual</th>
                      <th className="pb-3 font-medium text-right">Variance</th>
                      <th className="pb-3 font-medium text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBatches.map((batch) => (
                      <BatchRow key={batch.id} batch={batch} />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No invoiced batches yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Import invoices to your Trip Batches to see forecast vs actual
                comparisons. Each batch needs both trips and an invoice to show
                variance analysis.
              </p>
              <Button asChild>
                <Link href="/trips">
                  <Truck className="mr-2 h-4 w-4" />
                  Go to Trip Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BatchRow({ batch }: { batch: TripBatchSummary }) {
  const variance =
    batch.status === "INVOICED" && batch.actualTotal !== null
      ? batch.actualTotal - batch.projectedTotal
      : null;

  const variancePercent =
    variance !== null && batch.projectedTotal > 0
      ? (variance / batch.projectedTotal) * 100
      : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="py-3">
        <Link
          href={`/trips/${batch.id}`}
          className="font-medium hover:underline"
        >
          {batch.name}
        </Link>
        {batch.description && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {batch.description}
          </p>
        )}
      </td>
      <td className="py-3 text-right">
        <StatusBadge status={batch.status} />
      </td>
      <td className="py-3 text-right font-medium">
        {formatCurrency(batch.projectedTotal)}
      </td>
      <td className="py-3 text-right font-medium">
        {batch.actualTotal !== null ? formatCurrency(batch.actualTotal) : "—"}
      </td>
      <td className="py-3 text-right">
        {variance !== null ? (
          <span
            className={cn(
              "font-medium",
              variance >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {variance >= 0 ? "+" : ""}
            {formatCurrency(variance)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 text-right">
        {variancePercent !== null ? (
          <span
            className={cn(
              "font-medium",
              variancePercent >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {variancePercent >= 0 ? "+" : ""}
            {variancePercent.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: TripBatchSummary["status"] }) {
  const config: Record<
    TripBatchSummary["status"],
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    EMPTY: { label: "Empty", variant: "outline" },
    UPCOMING: { label: "Upcoming", variant: "secondary" },
    IN_PROGRESS: { label: "In Progress", variant: "default" },
    COMPLETED: { label: "Completed", variant: "default" },
    INVOICED: { label: "Invoiced", variant: "default" },
  };

  const { label, variant } = config[status];

  return (
    <Badge
      variant={variant}
      className={cn(
        status === "INVOICED" && "bg-purple-100 text-purple-800 hover:bg-purple-100",
        status === "COMPLETED" && "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
        status === "IN_PROGRESS" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
        status === "UPCOMING" && "bg-amber-100 text-amber-800 hover:bg-amber-100"
      )}
    >
      {label}
    </Badge>
  );
}
