"use client";

import { useAuth, useDashboardData } from "@/hooks";
import { MetricCard, MetricCardGrid } from "@/components/dashboard/metric-card";
import { WeeklyForecastWidget } from "@/components/dashboard/weekly-forecast-widget";
import { NextWeekPreviewCard } from "@/components/dashboard/next-week-preview-card";
import { ModelAccuracyWidget } from "@/components/dashboard/model-accuracy-widget";
import { YearToDateSummary } from "@/components/dashboard/year-to-date-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { ForecastVsActualTable } from "@/components/dashboard/forecast-vs-actual-table";
import { QuickActions } from "@/components/dashboard/quick-actions";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatContributionMargin(value: number): string {
  return `$${value.toFixed(0)}/truck/day`;
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s an overview of your financial performance
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

      {/* Metrics Grid */}
      <MetricCardGrid>
        <MetricCard
          title="Cash on Hand"
          value={hasMetrics ? formatCurrency(metrics.cashOnHand) : "$0.00"}
          description="Current balance"
          iconName="dollar-sign"
          loading={loading}
        />
        <MetricCard
          title="Weekly Revenue"
          value={hasMetrics ? formatCurrency(metrics.weeklyRevenue) : "$0.00"}
          iconName="trending-up"
          trend={
            hasMetrics && metrics.revenueChange !== null
              ? metrics.revenueChange >= 0
                ? "up"
                : "down"
              : null
          }
          trendValue={hasMetrics ? metrics.revenueChange : null}
          loading={loading}
        />
        <MetricCard
          title="Weekly Profit"
          value={hasMetrics ? formatCurrency(metrics.weeklyProfit) : "$0.00"}
          iconName={
            hasMetrics && metrics.weeklyProfit >= 0
              ? "trending-up"
              : "trending-down"
          }
          trend={
            hasMetrics && metrics.profitChange !== null
              ? metrics.profitChange >= 0
                ? "up"
                : "down"
              : null
          }
          trendValue={hasMetrics ? metrics.profitChange : null}
          loading={loading}
        />
        <MetricCard
          title="Contribution"
          value={
            hasMetrics
              ? formatContributionMargin(metrics.contributionMargin)
              : "$0/truck/day"
          }
          description={hasMetrics ? `${metrics.truckCount} trucks active` : "0 trucks"}
          iconName="truck"
          loading={loading}
        />
      </MetricCardGrid>

      {/* Year to Date Summary */}
      <YearToDateSummary
        data={dashboardData?.yearToDate || null}
        loading={loading}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Trend */}
          <CashFlowChart
            data={dashboardData?.cashFlowTrend || []}
            loading={loading}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            transactions={dashboardData?.recentTransactions || []}
            loading={loading}
          />
        </div>

        {/* Right Column - Forecasts & Quick Actions */}
        <div className="space-y-6">
          {/* This Week's Forecast */}
          <WeeklyForecastWidget
            data={dashboardData?.thisWeekForecast || null}
            loading={loading}
          />

          {/* Next Week Preview & Model Accuracy */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <NextWeekPreviewCard
              data={dashboardData?.nextWeekForecast || null}
              loading={loading}
            />
            <ModelAccuracyWidget
              data={dashboardData?.modelAccuracy || null}
              loading={loading}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>

      {/* Forecast vs Actual Table */}
      <ForecastVsActualTable
        data={dashboardData?.forecastVsActual || []}
        loading={loading}
      />
    </div>
  );
}
