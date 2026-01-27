import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function ForecastVsActualPage() {
  const currentWeek = new Date();
  const weekStart = new Date(currentWeek);
  weekStart.setDate(currentWeek.getDate() - currentWeek.getDay() + 1 - 7); // Last week Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Last week Sunday

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
        <Button variant="outline">
          Week: {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </Button>
      </div>

      {/* Variance Summary */}
      <Card>
        <CardContent className="py-6">
          <div className="grid gap-6 sm:grid-cols-3 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Forecast</p>
              <p className="text-3xl font-bold">$0.00</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Actual</p>
              <p className="text-3xl font-bold">$0.00</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Variance</p>
              <p className="text-3xl font-bold text-muted-foreground">$0.00 (0%)</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-0 bg-primary" />
              </div>
              <span>No data</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Variance Breakdown</CardTitle>
          <CardDescription>
            Detailed comparison by component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GitCompare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No comparison data
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Import trips for forecasting and Amazon invoices for actuals to see variance analysis.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/trips">Import Trips</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/amazon-invoices">Import Invoices</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Table Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Component Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Component</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Forecast</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actual</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Variance</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Tour Pay</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Accessorials</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Adjustments</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                </tr>
                <tr className="font-medium">
                  <td className="py-3 px-4">TOTAL</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                  <td className="text-right py-3 px-4">$0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>Better than forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <span>Below forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Adjustment (TONU, etc.)</span>
        </div>
      </div>
    </div>
  );
}
