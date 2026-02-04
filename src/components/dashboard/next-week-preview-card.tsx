"use client";

import Link from "next/link";
import { format, getWeek } from "date-fns";
import { CalendarPlus, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface NextWeekForecast {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  projectedTotal: number;
  hasTrips: boolean;
  tripCount: number;
}

interface NextWeekPreviewCardProps {
  data: NextWeekForecast | null;
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

export function NextWeekPreviewCard({ data, loading = false }: NextWeekPreviewCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  const weekNumber = data?.weekNumber ?? getWeek(new Date(), { weekStartsOn: 1 }) + 1;
  const weekDateRange = data
    ? `${format(new Date(data.weekStart), "MMM d")} - ${format(new Date(data.weekEnd), "MMM d")}`
    : "Next week";

  return (
    <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-slate-600" />
          <span>Week {weekNumber}</span>
        </CardTitle>
        <CardDescription>{weekDateRange}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.hasTrips ? (
          <>
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(data.projectedTotal)}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.tripCount} trip{data.tripCount !== 1 ? "s" : ""} scheduled
            </p>
          </>
        ) : (
          <>
            <div className="text-lg font-medium text-muted-foreground">
              Awaiting trips
            </div>
            <p className="text-sm text-muted-foreground">
              No trips imported for next week yet
            </p>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          asChild
        >
          <Link href="/trips">
            <Upload className="h-4 w-4 mr-2" />
            {data?.hasTrips ? "View Trips" : "Import Trips"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
