"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuarterlySummary {
  quarter: number;
  quarterLabel: string;
  year: number;
  projected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  accuracy: number;
  batchCount: number;
  tripCount: number;
}

interface QuarterlySummaryTableProps {
  data: QuarterlySummary[];
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

export function QuarterlySummaryTable({ data, year, loading = false }: QuarterlySummaryTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0;

  // Calculate totals
  const totals = data.reduce(
    (acc, q) => ({
      projected: acc.projected + q.projected,
      actual: acc.actual + q.actual,
      tripCount: acc.tripCount + q.tripCount,
      batchCount: acc.batchCount + q.batchCount,
    }),
    { projected: 0, actual: 0, tripCount: 0, batchCount: 0 }
  );

  const totalVariance = totals.actual - totals.projected;
  const totalVariancePercent = totals.projected > 0 ? (totalVariance / totals.projected) * 100 : 0;
  const totalAccuracy = totals.projected > 0
    ? Math.max(0, (1 - Math.abs(totalVariance) / totals.projected) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-muted-foreground" />
          Quarterly Summary
        </CardTitle>
        <CardDescription>
          Performance breakdown by quarter for {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead className="text-right">Projected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Trips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((quarter) => (
                <TableRow key={quarter.quarter}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{quarter.quarterLabel}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({quarter.batchCount} batches)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quarter.projected)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {quarter.actual > 0 ? formatCurrency(quarter.actual) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {quarter.actual > 0 ? (
                      <span className={cn(
                        "font-medium",
                        quarter.variance >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {quarter.variance >= 0 ? "+" : ""}
                        {formatCurrency(quarter.variance)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {quarter.actual > 0 ? (
                      <Badge variant={
                        quarter.accuracy >= 95 ? "default" :
                        quarter.accuracy >= 90 ? "secondary" : "destructive"
                      } className={cn(
                        quarter.accuracy >= 95 ? "bg-emerald-500" :
                        quarter.accuracy >= 90 ? "bg-blue-500" : ""
                      )}>
                        {quarter.accuracy.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {quarter.tripCount}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>
                  <Badge variant="default">Total</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.projected)}
                </TableCell>
                <TableCell className="text-right">
                  {totals.actual > 0 ? formatCurrency(totals.actual) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {totals.actual > 0 ? (
                    <span className={cn(
                      totalVariance >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {totalVariance >= 0 ? "+" : ""}
                      {formatCurrency(totalVariance)}
                      <span className="text-xs ml-1">
                        ({totalVariancePercent >= 0 ? "+" : ""}
                        {totalVariancePercent.toFixed(1)}%)
                      </span>
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {totals.actual > 0 ? (
                    <span className={cn(
                      totalAccuracy >= 95 ? "text-emerald-600" :
                      totalAccuracy >= 90 ? "text-blue-600" : "text-amber-600"
                    )}>
                      {totalAccuracy.toFixed(1)}%
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {totals.tripCount}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-4">
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No quarterly data available</p>
            <p className="text-xs text-muted-foreground">
              Import trips to see quarterly summary
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
