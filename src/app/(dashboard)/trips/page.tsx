"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Truck, Package, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripsImportModal, TripsTable } from "@/components/forecasting";
import {
  getTripsWithStats,
  getTripDateRange,
  type TripSummary,
  type WeekStats,
  type TripDateRange,
} from "@/actions/forecasting/trips";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PeriodOption = "all" | "custom" | "thisMonth" | "lastMonth" | "last3Months" | "thisWeek" | "lastWeek";

export default function TripsPage() {
  const [loading, setLoading] = useState(true);
  const [periodOption, setPeriodOption] = useState<PeriodOption>("all");
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [stats, setStats] = useState<WeekStats>({
    totalTrips: 0,
    projectedLoads: 0,
    actualLoads: 0,
    updatedCount: 0,
    completion: 0,
  });
  const [dateRange, setDateRange] = useState<TripDateRange | null>(null);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showImport, setShowImport] = useState(false);

  // Fetch available date range on mount
  useEffect(() => {
    async function fetchDateRange() {
      const result = await getTripDateRange();
      if (result.success && result.data) {
        setDateRange(result.data);
        // Set initial custom dates to full range
        if (result.data.minDate) {
          setCustomStartDate(new Date(result.data.minDate));
        }
        if (result.data.maxDate) {
          setCustomEndDate(new Date(result.data.maxDate));
        }
      }
    }
    fetchDateRange();
  }, []);

  const getDateRangeForPeriod = useCallback((): { start: Date; end: Date } | null => {
    const now = new Date();

    switch (periodOption) {
      case "all":
        // Return null to fetch all data (no date filter)
        return null;

      case "thisWeek": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "lastWeek": {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() + diffToMonday);
        const start = new Date(thisMonday);
        start.setDate(thisMonday.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "lastMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "last3Months": {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }

      case "custom":
        if (customStartDate && customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return { start: customStartDate, end };
        }
        return null;

      default:
        return null;
    }
  }, [periodOption, customStartDate, customEndDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRangeForPeriod();
      const result = await getTripsWithStats(range?.start, range?.end);

      if (result.success) {
        setTrips(result.data.trips);
        setStats(result.data.stats);
      } else {
        toast.error(result.error || "Failed to load trips");
      }
    } catch {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [getDateRangeForPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const projectedRevenue = trips.reduce((sum, t) => sum + (t.projectedRevenue || 0), 0);
  const actualRevenue = trips.reduce((sum, t) => sum + (t.actualRevenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trips</h1>
          <p className="text-sm text-muted-foreground">
            Manage scheduled trips and track actual loads
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={periodOption}
            onValueChange={(value) => setPeriodOption(value as PeriodOption)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {periodOption === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-[140px]"
                value={customStartDate ? customStartDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                max={customEndDate ? customEndDate.toISOString().split("T")[0] : undefined}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                className="w-[140px]"
                value={customEndDate ? customEndDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                min={customStartDate ? customStartDate.toISOString().split("T")[0] : undefined}
              />
            </div>
          )}

          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Trips
          </Button>
        </div>
      </div>

      {/* Data range info */}
      {dateRange?.hasTrips && (
        <div className="text-sm text-muted-foreground">
          Available data: {formatDate(new Date(dateRange.minDate!))} - {formatDate(new Date(dateRange.maxDate!))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.totalTrips}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.projectedLoads}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actual Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.actualLoads}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `${stats.completion}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.updatedCount} of {stats.totalTrips} trips updated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      {!loading && trips.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Projected Revenue</p>
                  <p className="text-xs text-emerald-600">Based on $452 DTR + estimated accessorials</p>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(projectedRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          {actualRevenue > 0 && (
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Actual Revenue</p>
                    <p className="text-xs text-blue-600">From completed trips</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(actualRevenue)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Trips Table */}
      {trips.length > 0 || loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Trip Schedule</CardTitle>
            <CardDescription>
              Update actual loads each night to track variance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TripsTable trips={trips} loading={loading} onUpdate={fetchData} />
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <CardHeader>
            <CardTitle>Trip Schedule</CardTitle>
            <CardDescription>Import trips from Amazon Scheduler to track loads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No trips found
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {dateRange?.hasTrips
                  ? "No trips found for the selected period. Try changing the date filter."
                  : "Import your trip schedule from Amazon Scheduler CSV to track projected vs actual loads."}
              </p>
              <Button onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Trips
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800">
                Update actual loads each night
              </p>
              <p className="text-xs text-blue-700">
                Recording actual loads helps improve forecast accuracy and track variance from projected deliveries.
                Click on the Actual column to edit the number of loads delivered.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>Updated</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-500" />
          <span>Scheduled</span>
        </div>
      </div>

      {/* Import Modal */}
      <TripsImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={fetchData}
      />
    </div>
  );
}
