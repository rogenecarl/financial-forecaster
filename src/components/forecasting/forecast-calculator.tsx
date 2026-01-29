"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Users, DollarSign, Calculator, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { calculateForecast, generateScalingTable } from "@/lib/forecast-calculations";
import { createForecast } from "@/actions/forecasting";
import type { ForecastInput, CreateForecast } from "@/schema/forecasting.schema";
import { toast } from "sonner";

interface ForecastCalculatorProps {
  onSave?: () => void;
}

const defaultInputs: ForecastInput = {
  truckCount: 2,
  nightsPerWeek: 7,
  toursPerTruck: 1,
  avgLoadsPerTour: 4,
  dtrRate: 452,
  avgAccessorialRate: 77,
  hourlyWage: 20,
  hoursPerNight: 10,
  includeOvertime: false,
  overtimeMultiplier: 1.5,
  payrollTaxRate: 0.0765,
  workersCompRate: 0.05,
  weeklyOverhead: 0,
};

export function ForecastCalculator({ onSave }: ForecastCalculatorProps) {
  const [inputs, setInputs] = useState<ForecastInput>(defaultInputs);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculate results
  const results = useMemo(() => calculateForecast(inputs), [inputs]);

  // Generate scaling table
  const scalingTable = useMemo(
    () => generateScalingTable(inputs, [2, 4, 6, 8, 10]),
    [inputs]
  );

  const updateInput = <K extends keyof ForecastInput>(key: K, value: ForecastInput[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSave = async () => {
    if (!scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    setSaving(true);
    try {
      const data: CreateForecast = {
        name: scenarioName,
        description: scenarioDescription || null,
        isDefault,
        truckCount: inputs.truckCount,
        nightsPerWeek: inputs.nightsPerWeek,
        toursPerTruck: inputs.toursPerTruck,
        avgLoadsPerTour: inputs.avgLoadsPerTour,
        dtrRate: inputs.dtrRate,
        avgAccessorialRate: inputs.avgAccessorialRate,
        hourlyWage: inputs.hourlyWage,
        hoursPerNight: inputs.hoursPerNight,
        overtimeMultiplier: inputs.overtimeMultiplier,
        payrollTaxRate: inputs.payrollTaxRate,
        workersCompRate: inputs.workersCompRate,
        weeklyOverhead: inputs.weeklyOverhead,
      };

      const result = await createForecast(data);

      if (result.success) {
        toast.success("Scenario saved");
        setShowSaveModal(false);
        setScenarioName("");
        setScenarioDescription("");
        setIsDefault(false);
        onSave?.();
      } else {
        toast.error(result.error || "Failed to save scenario");
      }
    } catch {
      toast.error("Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
            <CardDescription>Adjust values to model different scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Operations */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Operations</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Number of Trucks</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[inputs.truckCount]}
                      onValueChange={([v]) => updateInput("truckCount", v)}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-right font-medium">{inputs.truckCount}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nights per Week</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[inputs.nightsPerWeek]}
                      onValueChange={([v]) => updateInput("nightsPerWeek", v)}
                      min={1}
                      max={7}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-right font-medium">{inputs.nightsPerWeek}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Rates</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>DTR Rate</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={inputs.dtrRate}
                      onChange={(e) => updateInput("dtrRate", parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Avg Accessorial</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={inputs.avgAccessorialRate}
                      onChange={(e) => updateInput("avgAccessorialRate", parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Avg Loads per Tour</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[inputs.avgLoadsPerTour]}
                    onValueChange={([v]) => updateInput("avgLoadsPerTour", v)}
                    min={1}
                    max={8}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="w-8 text-right font-medium">{inputs.avgLoadsPerTour}</span>
                </div>
              </div>
            </div>

            {/* Labor Costs */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Labor Costs</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hourly Wage</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={inputs.hourlyWage}
                      onChange={(e) => updateInput("hourlyWage", parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hours per Night</Label>
                  <Input
                    type="number"
                    value={inputs.hoursPerNight}
                    onChange={(e) => updateInput("hoursPerNight", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payroll Tax Rate</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={(inputs.payrollTaxRate * 100).toFixed(2)}
                      onChange={(e) => updateInput("payrollTaxRate", (parseFloat(e.target.value) || 0) / 100)}
                      className="pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Workers Comp Rate</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={(inputs.workersCompRate * 100).toFixed(2)}
                      onChange={(e) => updateInput("workersCompRate", (parseFloat(e.target.value) || 0) / 100)}
                      className="pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={inputs.includeOvertime}
                  onCheckedChange={(v) => updateInput("includeOvertime", v)}
                />
                <Label>Include Overtime Calculation</Label>
              </div>
              <div className="space-y-2">
                <Label>Weekly Overhead</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={inputs.weeklyOverhead}
                    onChange={(e) => updateInput("weeklyOverhead", parseFloat(e.target.value) || 0)}
                    className="pl-7"
                  />
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
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(results.weeklyRevenue)}
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tour Pay ({results.weeklyTours} tours)</span>
                  <span>{formatCurrency(results.tourPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accessorials ({results.weeklyLoads} loads)</span>
                  <span>{formatCurrency(results.accessorialPay)}</span>
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
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(results.weeklyCost)}
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Labor</span>
                  <span>{formatCurrency(results.laborCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payroll Tax</span>
                  <span>{formatCurrency(results.payrollTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Workers Comp</span>
                  <span>{formatCurrency(results.workersComp)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overhead</span>
                  <span>{formatCurrency(results.overhead)}</span>
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
              <div className={`text-3xl font-bold ${results.weeklyProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(results.weeklyProfit)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Contribution Margin:{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(results.contributionMargin)}/truck/day
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setShowSaveModal(true)} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Scenario
          </Button>
        </div>
      </div>

      {/* Scaling Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Scenarios</CardTitle>
          <CardDescription>See how profit scales with additional trucks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trucks</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Costs</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Margin/Truck/Day</th>
                </tr>
              </thead>
              <tbody>
                {scalingTable.map((row) => (
                  <tr
                    key={row.trucks}
                    className={`border-b last:border-0 hover:bg-muted/50 ${
                      row.trucks === inputs.truckCount ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-medium">{row.trucks}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(row.weeklyRevenue)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(row.weeklyCost)}</td>
                    <td className={`text-right py-3 px-4 font-medium ${row.weeklyProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(row.weeklyProfit)}
                    </td>
                    <td className="text-right py-3 px-4">{formatCurrency(row.contributionMargin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Scenario Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Save this forecast configuration for future reference
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Scenario Name *</Label>
              <Input
                placeholder="e.g., Current Operations, Growth Plan"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of this scenario"
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label>Set as default scenario</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !scenarioName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
