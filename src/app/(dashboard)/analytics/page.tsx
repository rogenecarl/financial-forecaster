"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YearSelector } from "@/components/reports/year-selector";
import {
  AccuracyTrendChart,
  MonthlyBreakdownChart,
  QuarterlySummaryTable,
  TopPerformingBatches,
  HistoricalComparisonCard,
  YearlySummaryCard,
} from "@/components/analytics";
import { useAnalyticsData, useHistoricalComparison } from "@/hooks";

export default function AnalyticsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [comparisonType, setComparisonType] = useState<"ytd" | "q1" | "q2" | "q3" | "q4">("ytd");

  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useAnalyticsData(selectedYear);

  // Compute quarter number for comparison
  const quarterNumber = useMemo(() => {
    if (comparisonType === "ytd") return undefined;
    return parseInt(comparisonType.replace("q", ""));
  }, [comparisonType]);

  // Fetch historical comparison
  const {
    data: comparisonData,
    isLoading: comparisonLoading,
  } = useHistoricalComparison(selectedYear, { quarter: quarterNumber });

  // Derive available years from data
  const availableYears = analyticsData?.availableYears ?? [currentYear];

  // Get comparison period label
  const comparisonLabel = useMemo(() => {
    if (comparisonType === "ytd") return "Year to Date";
    return `Q${quarterNumber}`;
  }, [comparisonType, quarterNumber]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Year-over-year performance analysis and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelector
            value={selectedYear}
            onChange={setSelectedYear}
            minYear={Math.min(...availableYears, currentYear - 5)}
            maxYear={currentYear}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchAnalytics()}
            disabled={analyticsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="space-y-6">
          {/* Loading Skeleton */}
          <Skeleton className="h-[250px] w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : analyticsData ? (
        <>
          {/* Yearly Summary Card */}
          <YearlySummaryCard data={analyticsData.yearlySummary} />

          {/* Main Analytics Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Breakdown Chart */}
            <MonthlyBreakdownChart
              data={analyticsData.monthlyBreakdown}
              year={selectedYear}
            />

            {/* Accuracy Trend Chart */}
            <AccuracyTrendChart data={analyticsData.accuracyTrend} />
          </div>

          {/* Quarterly Summary Table */}
          <QuarterlySummaryTable
            data={analyticsData.quarterlySummary}
            year={selectedYear}
          />

          {/* Two Column Layout for Top Batches and Historical Comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Performing Batches */}
            <TopPerformingBatches
              data={analyticsData.topPerformingBatches}
              year={selectedYear}
            />

            {/* Historical Comparison with Period Selector */}
            <div className="space-y-4">
              {/* Period Type Selector */}
              <Tabs
                value={comparisonType}
                onValueChange={(v) => setComparisonType(v as typeof comparisonType)}
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="ytd">YTD</TabsTrigger>
                  <TabsTrigger value="q1">Q1</TabsTrigger>
                  <TabsTrigger value="q2">Q2</TabsTrigger>
                  <TabsTrigger value="q3">Q3</TabsTrigger>
                  <TabsTrigger value="q4">Q4</TabsTrigger>
                </TabsList>
              </Tabs>

              <HistoricalComparisonCard
                data={comparisonData}
                periodLabel={comparisonLabel}
                loading={comparisonLoading}
              />
            </div>
          </div>

          {/* Additional Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                Key observations for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Best Month */}
                {analyticsData.monthlyBreakdown.length > 0 && (
                  <InsightCard
                    title="Best Month"
                    value={(() => {
                      const best = analyticsData.monthlyBreakdown.reduce(
                        (max, m) => (m.actual > max.actual ? m : max),
                        analyticsData.monthlyBreakdown[0]
                      );
                      return best.monthLabel;
                    })()}
                    subtitle={`$${(analyticsData.monthlyBreakdown.reduce(
                      (max, m) => (m.actual > max.actual ? m : max),
                      analyticsData.monthlyBreakdown[0]
                    ).actual / 1000).toFixed(1)}k revenue`}
                    variant="success"
                  />
                )}

                {/* Forecasting Accuracy */}
                <InsightCard
                  title="Avg Accuracy"
                  value={`${analyticsData.yearlySummary.accuracy.toFixed(1)}%`}
                  subtitle={
                    analyticsData.yearlySummary.accuracy >= 95
                      ? "Excellent forecasting"
                      : analyticsData.yearlySummary.accuracy >= 90
                      ? "Good forecasting"
                      : "Room for improvement"
                  }
                  variant={
                    analyticsData.yearlySummary.accuracy >= 95
                      ? "success"
                      : analyticsData.yearlySummary.accuracy >= 90
                      ? "info"
                      : "warning"
                  }
                />

                {/* Completion Rate */}
                <InsightCard
                  title="Completion Rate"
                  value={`${(
                    (analyticsData.yearlySummary.batchesCompleted /
                      Math.max(analyticsData.yearlySummary.batchesTotal, 1)) *
                    100
                  ).toFixed(0)}%`}
                  subtitle={`${analyticsData.yearlySummary.batchesCompleted} of ${analyticsData.yearlySummary.batchesTotal} batches`}
                  variant="info"
                />

                {/* Average Batch Revenue */}
                <InsightCard
                  title="Avg Batch Revenue"
                  value={`$${(analyticsData.yearlySummary.averageBatchRevenue / 1000).toFixed(1)}k`}
                  subtitle="Per completed batch"
                  variant="success"
                />

                {/* Total Loads */}
                <InsightCard
                  title="Loads Delivered"
                  value={analyticsData.yearlySummary.loadsDelivered.toLocaleString()}
                  subtitle={`${analyticsData.yearlySummary.tripsCompleted} trips completed`}
                  variant="info"
                />

                {/* Cancellation Rate */}
                <InsightCard
                  title="Cancellation Rate"
                  value={`${(
                    (analyticsData.yearlySummary.canceledTrips /
                      Math.max(
                        analyticsData.yearlySummary.tripsCompleted +
                          analyticsData.yearlySummary.canceledTrips,
                        1
                      )) *
                    100
                  ).toFixed(1)}%`}
                  subtitle={`${analyticsData.yearlySummary.canceledTrips} trips canceled`}
                  variant={
                    analyticsData.yearlySummary.canceledTrips === 0
                      ? "success"
                      : "warning"
                  }
                />
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
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No analytics data
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Import trips and invoices to start tracking performance analytics.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/trips">Import Trips</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/amazon-invoices">Import Invoices</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for insight cards
interface InsightCardProps {
  title: string;
  value: string;
  subtitle: string;
  variant: "success" | "info" | "warning";
}

function InsightCard({ title, value, subtitle, variant }: InsightCardProps) {
  const variantClasses = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };

  const valueClasses = {
    success: "text-emerald-600",
    info: "text-blue-600",
    warning: "text-amber-600",
  };

  return (
    <div className={`p-4 rounded-lg border ${variantClasses[variant]}`}>
      <p className="text-xs font-medium opacity-80">{title}</p>
      <p className={`text-xl font-bold ${valueClasses[variant]}`}>{value}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
}
