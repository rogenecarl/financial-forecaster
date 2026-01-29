"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, TrendingUp, TrendingDown, GitCompare } from "lucide-react";
import type { ForecastVsActualWeek } from "@/actions/dashboard/dashboard";

interface ForecastVsActualTableProps {
  data: ForecastVsActualWeek[];
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

function formatVariance(value: number): string {
  const formatted = formatCurrency(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function ForecastVsActualTable({ data, loading = false }: ForecastVsActualTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-40 mt-1" />
          </div>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Forecast vs Actual</CardTitle>
          <CardDescription>Last 4 weeks comparison</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/forecast-vs-actual">
            Details <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Week</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right w-[80px]">Accuracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((week) => {
                  const hasActual = week.actual !== null;
                  const isPositiveVariance = (week.variance ?? 0) >= 0;

                  return (
                    <TableRow key={week.weekLabel}>
                      <TableCell className="font-medium">{week.weekLabel}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(week.forecast)}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasActual ? (
                          formatCurrency(week.actual!)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasActual && week.variance !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isPositiveVariance ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {isPositiveVariance ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatVariance(week.variance)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {week.accuracy !== null ? (
                          <span
                            className={`font-medium ${
                              week.accuracy >= 90
                                ? "text-emerald-600"
                                : week.accuracy >= 80
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {week.accuracy}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GitCompare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No forecast data yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Import trips and invoices to compare forecasts
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/trips">Import Trips</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
