"use client";

import { Construction, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ImportHistoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import History</h1>
        <p className="text-sm text-muted-foreground">
          Track your imported trips and invoices
        </p>
      </div>

      {/* Redesign Notice */}
      <Alert className="border-amber-200 bg-amber-50/50">
        <Construction className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Feature Moved to Trip Batches</AlertTitle>
        <AlertDescription className="text-amber-700">
          Import tracking is now managed through Trip Batches. Each Trip Batch tracks its own
          import history, including when trips and invoices were imported.
        </AlertDescription>
      </Alert>

      {/* Redirect Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Trip Batches
          </CardTitle>
          <CardDescription>
            View and manage your Trip Batches, which include import history for trips and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Trip Batches provide a better way to organize your delivery periods. Each batch contains:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
            <li>Imported trips with projected loads and revenue</li>
            <li>Imported invoices with actual payment data</li>
            <li>Automatic matching between trips and invoice line items</li>
            <li>Variance analysis (forecast vs actual)</li>
          </ul>
          <Button asChild>
            <Link href="/trips">View Trip Batches</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
