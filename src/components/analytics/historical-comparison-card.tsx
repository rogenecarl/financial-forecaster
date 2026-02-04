"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, GitCompare, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoricalComparison {
  currentPeriod: {
    year: number;
    weekNumber?: number;
    month?: number;
    quarter?: number;
    projected: number;
    actual: number;
    tripCount: number;
    loadCount: number;
    profit: number;
  };
  previousPeriod: {
    year: number;
    weekNumber?: number;
    month?: number;
    quarter?: number;
    projected: number;
    actual: number;
    tripCount: number;
    loadCount: number;
    profit: number;
  };
  growth: {
    revenue: number;
    revenuePercent: number;
    trips: number;
    tripsPercent: number;
    loads: number;
    loadsPercent: number;
    profit: number;
    profitPercent: number;
  };
}

interface HistoricalComparisonCardProps {
  data: HistoricalComparison | null;
  periodLabel: string;
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

export function HistoricalComparisonCard({ data, periodLabel, loading = false }: HistoricalComparisonCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t">
            <Skeleton className="h-20 w-full" />
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
            <GitCompare className="h-5 w-5 text-muted-foreground" />
            Year-over-Year Comparison
          </CardTitle>
          <CardDescription>
            Compare {periodLabel} performance across years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GitCompare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No historical data available</p>
            <p className="text-xs text-muted-foreground">
              Need data from multiple years to compare
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentPeriod, previousPeriod, growth } = data;
  const overallTrend = growth.revenuePercent >= 0;

  return (
    <Card className={cn(
      "bg-gradient-to-br border",
      overallTrend
        ? "from-emerald-50/30 to-blue-50/30 border-emerald-200/50"
        : "from-amber-50/30 to-red-50/30 border-amber-200/50"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {overallTrend ? (
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
          Year-over-Year Comparison
        </CardTitle>
        <CardDescription>
          {periodLabel} {currentPeriod.year} vs {previousPeriod.year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Period Comparison */}
        <div className="grid grid-cols-2 gap-6">
          {/* Current Year */}
          <div className="space-y-3 p-4 bg-background/80 rounded-lg border">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="bg-emerald-500">
                {currentPeriod.year}
              </Badge>
              <span className="text-xs text-muted-foreground">Current</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(currentPeriod.actual)}
              </p>
              <p className="text-xs text-muted-foreground">
                Revenue
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium">{currentPeriod.tripCount}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
              <div>
                <p className="font-medium">{currentPeriod.loadCount}</p>
                <p className="text-xs text-muted-foreground">Loads</p>
              </div>
            </div>
          </div>

          {/* Previous Year */}
          <div className="space-y-3 p-4 bg-background/80 rounded-lg border">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{previousPeriod.year}</Badge>
              <span className="text-xs text-muted-foreground">Previous</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {formatCurrency(previousPeriod.actual)}
              </p>
              <p className="text-xs text-muted-foreground">
                Revenue
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">{previousPeriod.tripCount}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">{previousPeriod.loadCount}</p>
                <p className="text-xs text-muted-foreground">Loads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Summary */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-3">Growth Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <div className="flex items-center gap-1">
                {growth.revenuePercent >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "font-semibold",
                  growth.revenuePercent >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {growth.revenuePercent >= 0 ? "+" : ""}
                  {growth.revenuePercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {growth.revenue >= 0 ? "+" : ""}{formatCurrency(growth.revenue)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Trips</p>
              <div className="flex items-center gap-1">
                {growth.tripsPercent >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "font-semibold",
                  growth.tripsPercent >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {growth.tripsPercent >= 0 ? "+" : ""}
                  {growth.tripsPercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {growth.trips >= 0 ? "+" : ""}{growth.trips} trips
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Loads</p>
              <div className="flex items-center gap-1">
                {growth.loadsPercent >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "font-semibold",
                  growth.loadsPercent >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {growth.loadsPercent >= 0 ? "+" : ""}
                  {growth.loadsPercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {growth.loads >= 0 ? "+" : ""}{growth.loads} loads
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Profit</p>
              <div className="flex items-center gap-1">
                {growth.profitPercent >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "font-semibold",
                  growth.profitPercent >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {growth.profitPercent >= 0 ? "+" : ""}
                  {growth.profitPercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {growth.profit >= 0 ? "+" : ""}{formatCurrency(growth.profit)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
