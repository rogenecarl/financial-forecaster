"use client";

import { useAuth, useDashboardData } from "@/hooks";
import { MetricCard, MetricCardGrid } from "@/components/dashboard/metric-card";
import { RevenuePipeline } from "@/components/dashboard/revenue-pipeline";
import { ActiveBatches } from "@/components/dashboard/active-batches";
import { PLQuickView } from "@/components/dashboard/pl-quick-view";
import { VarianceSnapshot } from "@/components/dashboard/variance-snapshot";
import { WeeklyForecastWidget } from "@/components/dashboard/weekly-forecast-widget";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  const { data: dashboardData, isLoading } = useDashboardData();

  const metrics = dashboardData?.metrics;
  const hasMetrics = metrics !== undefined && metrics !== null;
  const loading = isLoading || !dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Header + Date */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your financial overview
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <MetricCardGrid>
        <MetricCard
          title="Revenue Earned"
          value={hasMetrics ? formatCurrency(metrics.revenueEarned) : "$0"}
          description={
            hasMetrics
              ? `From ${metrics.revenueEarnedBatchCount} invoiced ${metrics.revenueEarnedBatchCount === 1 ? "batch" : "batches"}`
              : "No invoiced batches yet"
          }
          iconName="dollar-sign"
          accent="emerald"
          loading={loading}
        />
        <MetricCard
          title="In Pipeline"
          value={hasMetrics ? formatCurrency(metrics.inPipeline) : "$0"}
          description={
            hasMetrics
              ? `${metrics.inPipelineBatchCount} active ${metrics.inPipelineBatchCount === 1 ? "batch" : "batches"}`
              : "No active batches"
          }
          iconName="trending-up"
          accent="blue"
          loading={loading}
        />
        <MetricCard
          title="Uncategorized"
          value={hasMetrics ? String(metrics.uncategorizedCount) : "0"}
          description={
            hasMetrics && metrics.uncategorizedCount > 0
              ? "Transactions need review"
              : "All categorized"
          }
          iconName="receipt"
          accent="gold"
          loading={loading}
        />
        <MetricCard
          title="Forecast Accuracy"
          value={
            hasMetrics && metrics.forecastAccuracy !== null
              ? `${metrics.forecastAccuracy.toFixed(1)}%`
              : "—"
          }
          description={
            hasMetrics && metrics.forecastAccuracy !== null
              ? `Last ${metrics.forecastAccuracyBatchCount} invoiced ${metrics.forecastAccuracyBatchCount === 1 ? "batch" : "batches"}`
              : "No invoiced data yet"
          }
          iconName="target"
          accent="purple"
          loading={loading}
        />
      </MetricCardGrid>

      {/* Revenue Pipeline — full width */}
      <RevenuePipeline
        data={dashboardData?.revenuePipeline ?? null}
        loading={loading}
      />

      {/* Active Batches (2/3) | P&L Quick View (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActiveBatches
            data={dashboardData?.activeBatches ?? []}
            loading={loading}
          />
        </div>
        <div>
          <PLQuickView
            data={dashboardData?.plQuickView ?? null}
            loading={loading}
          />
        </div>
      </div>

      {/* Cash Flow Chart (2/3) | Forecast Widget + Quick Actions (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowChart
            data={dashboardData?.cashFlowTrend ?? []}
            loading={loading}
          />
        </div>
        <div className="space-y-6">
          <WeeklyForecastWidget
            data={dashboardData?.thisWeekForecast ?? null}
            loading={loading}
          />
          <QuickActions />
        </div>
      </div>

      {/* Variance Snapshot — full width */}
      <VarianceSnapshot
        data={dashboardData?.varianceSnapshot ?? []}
        loading={loading}
      />
    </div>
  );
}
