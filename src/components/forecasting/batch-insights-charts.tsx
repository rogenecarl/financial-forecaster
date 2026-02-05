"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";
import type { TripBatchSummary } from "@/actions/forecasting/trip-batches";
import type { TripWithLoadsForTable } from "@/actions/forecasting/trips";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

// ============================================
// COLORS
// ============================================

const CHART_COLORS = {
  statusActive: "#3b82f6",
  statusCompleted: "#10b981",
  statusCanceled: "#ef4444",
} as const;

// ============================================
// FORMAT HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// ============================================
// CHART 1: PER-TRIP REVENUE COMPARISON
// ============================================

interface PerTripPoint {
  tripId: string;
  projected: number;
  actual: number;
  variance: number;
}

function buildPerTripData(trips: TripWithLoadsForTable[]): PerTripPoint[] {
  const { DTR_RATE, TRIP_ACCESSORIAL_RATE } = FORECASTING_CONSTANTS;
  const perTripRate = DTR_RATE + TRIP_ACCESSORIAL_RATE;

  return trips
    .filter(
      (t): t is TripWithLoadsForTable & { actualRevenue: number } =>
        t.tripStage !== "CANCELED" &&
        t.actualRevenue !== null &&
        t.actualRevenue > 0
    )
    .map((t) => {
      const projected = t.projectedRevenue || perTripRate;
      return {
        tripId:
          t.tripId.length > 14 ? `...${t.tripId.slice(-10)}` : t.tripId,
        projected,
        actual: t.actualRevenue,
        variance: t.actualRevenue - projected,
      };
    })
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10);
}

function PerTripRevenueChart({ trips }: { trips: TripWithLoadsForTable[] }) {
  const data = useMemo(() => buildPerTripData(trips), [trips]);

  if (data.length === 0) return null;

  const totalTripsWithActuals = trips.filter(
    (t) => t.tripStage !== "CANCELED" && (t.actualRevenue ?? 0) > 0
  ).length;

  const chartHeight = Math.min(420, Math.max(160, data.length * 40 + 20));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Per-Trip Revenue Comparison
        </CardTitle>
        <CardDescription className="mt-1">
          Projected vs actual revenue per trip
          {totalTripsWithActuals > 10 && (
            <span className="text-muted-foreground/70">
              {" "}
              &middot; showing top 10 by variance of {totalTripsWithActuals}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="pt-grad-projected"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.95} />
              </linearGradient>
              <linearGradient
                id="pt-grad-actual"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="currentColor"
              opacity={0.06}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="tripId"
              width={95}
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const projected =
                  payload.find((p) => p.dataKey === "projected")?.value ?? 0;
                const actual =
                  payload.find((p) => p.dataKey === "actual")?.value ?? 0;
                const v = (actual as number) - (projected as number);
                return (
                  <div className="rounded-lg border bg-card px-3 py-2.5 shadow-xl min-w-[170px]">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Trip {label}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />{" "}
                          Projected
                        </span>
                        <span className="text-xs font-bold tabular-nums">
                          {formatCurrency(projected as number)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                          Actual
                        </span>
                        <span className="text-xs font-bold tabular-nums">
                          {formatCurrency(actual as number)}
                        </span>
                      </div>
                      <div className="border-t pt-1 mt-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">
                            Variance
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold tabular-nums",
                              v >= 0 ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {v >= 0 ? "+" : ""}
                            {formatCurrency(v)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "currentColor", opacity: 0.04 }}
            />
            <Bar
              dataKey="projected"
              fill="url(#pt-grad-projected)"
              radius={[0, 3, 3, 0]}
              barSize={13}
              isAnimationActive={true}
              animationDuration={600}
            />
            <Bar
              dataKey="actual"
              fill="url(#pt-grad-actual)"
              radius={[0, 3, 3, 0]}
              barSize={13}
              isAnimationActive={true}
              animationDuration={600}
              animationBegin={200}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-500" />
            Projected (
            {formatCurrency(
              FORECASTING_CONSTANTS.DTR_RATE +
                FORECASTING_CONSTANTS.TRIP_ACCESSORIAL_RATE
            )}
            /trip)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500" />
            Actual
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CHART 2: TRIP STATUS DISTRIBUTION
// ============================================

interface StatusSegment {
  name: string;
  value: number;
  fill: string;
  percentage: number;
}

function buildStatusData(batch: TripBatchSummary): StatusSegment[] {
  const total = batch.tripCount;
  if (total === 0) return [];

  const completed = batch.completedCount;
  const canceled = batch.canceledCount;
  const active = total - completed - canceled;

  return [
    {
      name: "Active",
      value: active,
      fill: CHART_COLORS.statusActive,
      percentage: Math.round((active / total) * 100),
    },
    {
      name: "Completed",
      value: completed,
      fill: CHART_COLORS.statusCompleted,
      percentage: Math.round((completed / total) * 100),
    },
    {
      name: "Canceled",
      value: canceled,
      fill: CHART_COLORS.statusCanceled,
      percentage: Math.round((canceled / total) * 100),
    },
  ].filter((d) => d.value > 0);
}

function TripStatusChart({ batch }: { batch: TripBatchSummary }) {
  const data = useMemo(() => buildStatusData(batch), [batch]);

  if (data.length === 0) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Trip Status
        </CardTitle>
        <CardDescription className="mt-1">
          {batch.tripCount} total trips
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 flex flex-col items-center flex-1 justify-center">
        <div className="relative w-full">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                isAnimationActive={true}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const seg = payload[0].payload as StatusSegment;
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 shadow-xl">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: seg.fill }}
                        />
                        <span className="text-xs font-medium">{seg.name}</span>
                      </div>
                      <p className="text-sm font-bold tabular-nums mt-0.5">
                        {seg.value} trips ({seg.percentage}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center -mt-1">
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {batch.tripCount}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                trips
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-1 text-[11px]">
          {data.map((segment) => (
            <span
              key={segment.name}
              className="flex items-center gap-1.5 text-muted-foreground"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: segment.fill }}
              />
              {segment.name}
              <span className="font-semibold text-foreground tabular-nums">
                {segment.value}
              </span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

interface BatchInsightsChartsProps {
  batch: TripBatchSummary;
  trips: TripWithLoadsForTable[];
}

export function BatchInsightsCharts({
  batch,
  trips,
}: BatchInsightsChartsProps) {
  const hasTrips = batch.tripCount > 0;
  const hasInvoice = batch.status === "INVOICED" && batch.actualTotal !== null;

  if (!hasTrips) return null;

  if (hasInvoice) {
    return (
      <div className="space-y-4">
        {/* Row 1: Status Donut + Per-Trip Revenue Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <TripStatusChart batch={batch} />
          </div>
          <div className="lg:col-span-2">
            <PerTripRevenueChart trips={trips} />
          </div>
        </div>
      </div>
    );
  }

  // Pre-invoice: show status distribution only
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <TripStatusChart batch={batch} />
    </div>
  );
}
