"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Truck,
  BarChart3,
  Wallet,
  CreditCard,
  PiggyBank,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Map of icon names to icon components
const iconMap = {
  "dollar-sign": DollarSign,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  truck: Truck,
  "bar-chart": BarChart3,
  wallet: Wallet,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  receipt: Receipt,
  minus: Minus,
} as const;

export type MetricIconName = keyof typeof iconMap;

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  iconName?: MetricIconName;
  trend?: "up" | "down" | "neutral" | null;
  trendValue?: number | null;
  loading?: boolean;
  className?: string;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" | null }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function getTrendColor(trend: "up" | "down" | "neutral" | null | undefined) {
  if (trend === "up") return "text-emerald-600";
  if (trend === "down") return "text-red-600";
  return "text-muted-foreground";
}

export function MetricCard({
  title,
  value,
  description,
  iconName,
  trend,
  trendValue,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-28 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const Icon = iconName ? iconMap[iconName] : null;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trendValue !== null) && (
          <div className={cn("flex items-center gap-1 text-xs", getTrendColor(trend))}>
            {trend && trendValue !== null && <TrendIcon trend={trend} />}
            <span>
              {trendValue !== null && trendValue !== undefined && (
                <>
                  {trendValue > 0 ? "+" : ""}
                  {trendValue.toFixed(1)}% vs last week
                </>
              )}
              {description && !trendValue && description}
            </span>
          </div>
        )}
        {description && trendValue !== null && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricCardGrid({ children, className }: MetricCardGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}
