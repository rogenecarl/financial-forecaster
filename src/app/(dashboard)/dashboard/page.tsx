import { getServerUser } from "@/lib/auth-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  Upload,
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getServerUser();
  const firstName = user?.name?.split(" ")[0] || "there";

  // Placeholder data - will be replaced with real data in Phase 7
  const metrics = [
    {
      title: "Cash on Hand",
      value: "$9,180.57",
      description: "Current balance",
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Weekly Revenue",
      value: "$8,366.41",
      description: "+12% vs last week",
      icon: TrendingUp,
      trend: "up" as const,
    },
    {
      title: "Weekly Profit",
      value: "-$2,489.73",
      description: "-8% vs last week",
      icon: TrendingDown,
      trend: "down" as const,
    },
    {
      title: "Contribution",
      value: "$154/truck/day",
      description: "2 trucks active",
      icon: Truck,
      trend: null,
    },
  ];

  const quickActions = [
    {
      title: "Import Transactions",
      description: "Upload bank statement CSV",
      icon: Upload,
      href: "/transactions",
    },
    {
      title: "Import Amazon Invoice",
      description: "Upload payment details",
      icon: FileSpreadsheet,
      href: "/amazon-invoices",
    },
    {
      title: "Import Trips",
      description: "Upload scheduler export",
      icon: Truck,
      href: "/trips",
    },
    {
      title: "View Forecasting",
      description: "Predict weekly revenue",
      icon: BarChart3,
      href: "/forecasting",
    },
  ];

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p
                  className={`text-xs ${
                    metric.trend === "up"
                      ? "text-emerald-600"
                      : metric.trend === "down"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts (placeholder) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Trend</CardTitle>
              <CardDescription>Last 8 weeks performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart will be implemented in Phase 7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
                <p className="text-sm text-center text-muted-foreground pt-2">
                  Import transactions to see activity
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & This Week */}
        <div className="space-y-6">
          {/* This Week's Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>This Week&apos;s Forecast</CardTitle>
              <CardDescription>Week progress tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projected</span>
                  <span className="font-medium">$7,406.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: "0%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  0% of projected revenue
                </p>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trips</span>
                  <span>0/0 completed</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loads</span>
                  <span>0/0 delivered</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    asChild
                  >
                    <Link href={action.href}>
                      <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
