"use client";

import { CalendarDays, TrendingUp, Truck, Package, XCircle, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface YearToDateData {
  year: number;
  totalRevenue: number;
  totalProjected: number;
  accuracy: number;
  tripsCompleted: number;
  loadsDelivered: number;
  canceledCount: number;
}

interface YearToDateSummaryProps {
  data: YearToDateData | null;
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function YearToDateSummary({ data, loading = false }: YearToDateSummaryProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const year = data?.year ?? new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          Year to Date ({year})
        </CardTitle>
        <CardDescription>Summary of your performance this year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Revenue */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Revenue</span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {data ? formatCurrency(data.totalRevenue) : "-"}
            </div>
          </div>

          {/* Total Projected */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Projected</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {data ? formatCurrency(data.totalProjected) : "-"}
            </div>
          </div>

          {/* Accuracy */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Accuracy</span>
            </div>
            <div className="text-lg font-bold text-purple-700">
              {data && data.accuracy > 0 ? `${data.accuracy.toFixed(1)}%` : "-"}
            </div>
          </div>

          {/* Trips Completed */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Trips</span>
            </div>
            <div className="text-lg font-bold">
              {data ? formatNumber(data.tripsCompleted) : "-"}
            </div>
          </div>

          {/* Loads Delivered */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Loads</span>
            </div>
            <div className="text-lg font-bold">
              {data ? formatNumber(data.loadsDelivered) : "-"}
            </div>
          </div>

          {/* Canceled */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span>Canceled</span>
            </div>
            <div className="text-lg font-bold text-red-600">
              {data ? formatNumber(data.canceledCount) : "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
