"use client";

import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForecastVsActualPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast vs Actual</h1>
          <p className="text-sm text-muted-foreground">
            Compare predictions with actual Amazon payments
          </p>
        </div>
      </div>

      {/* Under Construction Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-amber-500" />
            Feature Being Redesigned
          </CardTitle>
          <CardDescription>
            The Forecast vs Actual comparison is being redesigned to work with the new Trip Batch system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This feature will be available once you have created Trip Batches and imported invoices.
            The new system provides better organization by grouping trips and invoices together.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/trips">View Trip Batches</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/amazon-invoices">View Invoices</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
