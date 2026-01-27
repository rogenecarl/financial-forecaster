import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, TrendingUp, DollarSign, Users, Calculator } from "lucide-react";

export default function ForecastingPage() {
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
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Scenario
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
            <CardDescription>
              Adjust values to model different scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Truck Operations */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Operations</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Number of Trucks</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div className="h-2 w-1/5 bg-primary rounded-full" />
                    </div>
                    <span className="text-sm font-medium w-8">2</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Nights per Week</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full">
                      <div className="h-2 w-full bg-primary rounded-full" />
                    </div>
                    <span className="text-sm font-medium w-8">7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium">Rates</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">DTR Rate</label>
                  <div className="text-lg font-semibold">$452.00</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Avg Accessorial</label>
                  <div className="text-lg font-semibold">$77.00</div>
                </div>
              </div>
            </div>

            {/* Labor Costs */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium">Labor Costs</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Hourly Wage</label>
                  <div className="text-lg font-semibold">$20.00</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Hours per Night</label>
                  <div className="text-lg font-semibold">10</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Payroll Tax Rate</label>
                  <div className="text-lg font-semibold">7.65%</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Workers Comp Rate</label>
                  <div className="text-lg font-semibold">5%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projected Results */}
        <div className="space-y-6">
          {/* Weekly Revenue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Weekly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">$7,406.00</div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tour Pay</span>
                  <span>$6,328.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Accessorials</span>
                  <span>$1,078.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Costs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Weekly Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">$5,250.00</div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Labor</span>
                  <span>$4,200.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Payroll Tax</span>
                  <span>$321.30</span>
                </div>
                <div className="flex justify-between">
                  <span>Workers Comp</span>
                  <span>$210.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Overhead</span>
                  <span>$500.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Profit */}
          <Card className="bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Weekly Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$2,156.00</div>
              <div className="mt-2 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Contribution Margin: <span className="font-medium text-foreground">$154/truck/day</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scaling Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Scenarios</CardTitle>
          <CardDescription>
            See how profit scales with additional trucks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trucks</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Costs</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Margin/Truck/Day</th>
                </tr>
              </thead>
              <tbody>
                {[2, 4, 6, 10].map((trucks) => (
                  <tr key={trucks} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{trucks}</td>
                    <td className="text-right py-3 px-4">${(3703 * trucks).toLocaleString()}</td>
                    <td className="text-right py-3 px-4">${(2625 * trucks).toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-medium text-emerald-600">
                      ${(1078 * trucks).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">$154</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
