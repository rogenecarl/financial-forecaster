"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Target,
  Truck,
  Package,
  XCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YearlySummary {
  year: number;
  totalProjected: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  accuracy: number;
  batchesCompleted: number;
  batchesTotal: number;
  tripsCompleted: number;
  loadsDelivered: number;
  canceledTrips: number;
  averageBatchRevenue: number;
  averageWeeklyProfit: number;
}

interface YearlySummaryCardProps {
  data: YearlySummary | null;
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

function StatItem({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = "text-muted-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className={cn("p-2 rounded-md bg-background", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold truncate">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}

export function YearlySummaryCard({ data, loading = false }: YearlySummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Yearly Summary
          </CardTitle>
          <CardDescription>
            Annual performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositiveVariance = data.variance >= 0;
  const progressPercent = data.batchesTotal > 0
    ? (data.batchesCompleted / data.batchesTotal) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              {data.year} Summary
            </CardTitle>
            <CardDescription>
              Annual performance overview
            </CardDescription>
          </div>
          <Badge
            variant={data.accuracy >= 95 ? "default" : data.accuracy >= 90 ? "secondary" : "outline"}
            className={cn(
              "text-sm",
              data.accuracy >= 95 ? "bg-emerald-500" :
              data.accuracy >= 90 ? "bg-blue-500" : ""
            )}
          >
            {data.accuracy.toFixed(1)}% Accuracy
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
            <p className="text-xs text-blue-600 font-medium">Total Projected</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(data.totalProjected)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
            <p className="text-xs text-emerald-600 font-medium">Total Actual</p>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(data.totalActual)}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg border",
            isPositiveVariance
              ? "bg-emerald-50/30 border-emerald-200/50"
              : "bg-red-50/30 border-red-200/50"
          )}>
            <div className="flex items-center gap-1">
              {isPositiveVariance ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className={cn(
                "text-xs font-medium",
                isPositiveVariance ? "text-emerald-600" : "text-red-600"
              )}>
                Variance
              </p>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              isPositiveVariance ? "text-emerald-700" : "text-red-700"
            )}>
              {isPositiveVariance ? "+" : ""}{formatCurrency(data.variance)}
            </p>
            <p className={cn(
              "text-xs",
              isPositiveVariance ? "text-emerald-600" : "text-red-600"
            )}>
              {isPositiveVariance ? "+" : ""}{data.variancePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Year Progress</span>
            <span className="font-medium">
              {data.batchesCompleted} of {data.batchesTotal} batches completed
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatItem
            icon={DollarSign}
            label="Avg Batch Revenue"
            value={formatCurrency(data.averageBatchRevenue)}
            iconColor="text-emerald-600"
          />
          <StatItem
            icon={Target}
            label="Avg Weekly Profit"
            value={formatCurrency(data.averageWeeklyProfit)}
            iconColor="text-blue-600"
          />
          <StatItem
            icon={Truck}
            label="Trips Completed"
            value={data.tripsCompleted.toLocaleString()}
            iconColor="text-amber-600"
          />
          <StatItem
            icon={Package}
            label="Loads Delivered"
            value={data.loadsDelivered.toLocaleString()}
            iconColor="text-indigo-600"
          />
        </div>

        {/* Canceled Trips Warning */}
        {data.canceledTrips > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              {data.canceledTrips} trip{data.canceledTrips !== 1 ? "s" : ""} canceled this year
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
