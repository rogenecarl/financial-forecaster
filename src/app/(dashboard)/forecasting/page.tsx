"use client";

import { useState } from "react";
import { Bookmark, Trash2, Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ForecastCalculator } from "@/components/forecasting";
import { useForecasts } from "@/hooks";

export default function ForecastingPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query hook
  const {
    forecasts: savedScenarios,
    deleteForecast,
    isDeleting: deleting,
    invalidate,
  } = useForecasts();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteForecast(deleteId);
    setDeleteId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecasting</h1>
          <p className="text-sm text-muted-foreground">
            Predict weekly revenue and model scenarios
          </p>
        </div>
      </div>

      {/* Forecast Calculator */}
      <ForecastCalculator onSave={invalidate} />

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Saved Scenarios
            </CardTitle>
            <CardDescription>
              Your saved forecast configurations for quick reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="relative p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {scenario.isDefault && (
                    <Star className="absolute top-2 right-2 h-4 w-4 text-amber-500 fill-amber-500" />
                  )}
                  <h4 className="font-medium mb-1">{scenario.name}</h4>
                  {scenario.description && (
                    <p className="text-xs text-muted-foreground mb-3">{scenario.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Trips/Week</p>
                      <p className="font-medium">{scenario.numberOfTrips}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Per Trip</p>
                      <p className="font-medium font-mono">
                        {formatCurrency(scenario.revenuePerTrip)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Weekly</p>
                      <p className="font-medium text-emerald-600 font-mono">
                        {formatCurrency(scenario.weeklyRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Annual</p>
                      <p className="font-medium font-mono">
                        {formatCurrency(scenario.annualRevenue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(scenario.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saved scenario? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
