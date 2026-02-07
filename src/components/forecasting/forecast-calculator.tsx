"use client";

import { useState, useMemo } from "react";
import { TrendingUp, DollarSign, Save, Loader2, Calculator } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface ForecastCalculatorProps {
  onSave?: () => void;
}

const defaultInputs: ForecastInput = {
  numberOfTrips: 7,
  dtrRate: 452.09,
  avgAccessorialPerTrip: 70,
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
    () => generateScalingTable(inputs, [7, 14, 21, 28, 35, 42]),
    [inputs]
  );

  const updateInput = <K extends keyof ForecastInput>(key: K, value: ForecastInput[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
        numberOfTrips: inputs.numberOfTrips,
        dtrRate: inputs.dtrRate,
        avgAccessorialPerTrip: inputs.avgAccessorialPerTrip,
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
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Input Parameters
            </CardTitle>
            <CardDescription>Adjust values to model different scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Number of Trips */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Number of Trips</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.numberOfTrips]}
                  onValueChange={([v]) => updateInput("numberOfTrips", v)}
                  min={1}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="w-10 text-right text-lg font-bold tabular-nums">
                  {inputs.numberOfTrips}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Total trips (tours) per week. Each trip earns one DTR payment.
              </p>
            </div>

            {/* DTR Rate */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-medium">DTR Rate (per trip)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={inputs.dtrRate}
                  onChange={(e) => updateInput("dtrRate", parseFloat(e.target.value) || 0)}
                  className="pl-7 text-lg font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Daily Trip Rate — base pay per completed trip/tour.
              </p>
            </div>

            {/* Avg Accessorial per Trip */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-base font-medium">Avg Accessorials per Trip</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={inputs.avgAccessorialPerTrip}
                  onChange={(e) => updateInput("avgAccessorialPerTrip", parseFloat(e.target.value) || 0)}
                  className="pl-7 text-lg font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Average accessorial payout per trip.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projected Results */}
        <div className="space-y-6">
          {/* Revenue per Trip */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue per Trip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 font-mono">
                {formatCurrency(results.revenuePerTrip)}
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>DTR</span>
                  <span className="font-mono">{formatCurrency(inputs.dtrRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accessorials</span>
                  <span className="font-mono">{formatCurrency(inputs.avgAccessorialPerTrip)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Revenue */}
          <Card className="bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Weekly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 font-mono">
                {formatCurrency(results.weeklyRevenue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {inputs.numberOfTrips} trips &times; {formatCurrency(results.revenuePerTrip)}/trip
              </p>
            </CardContent>
          </Card>

          {/* Monthly & Annual */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Monthly</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono">
                  {formatCurrency(results.monthlyRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Annual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono">
                  {formatCurrency(results.annualRevenue)}
                </div>
              </CardContent>
            </Card>
          </div>

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
          <CardDescription>See how revenue scales with additional trips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trips/Week</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Weekly</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Monthly</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Annual</th>
                </tr>
              </thead>
              <tbody>
                {scalingTable.map((row) => (
                  <tr
                    key={row.trips}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/50",
                      row.trips === inputs.numberOfTrips && "bg-primary/5 font-medium"
                    )}
                  >
                    <td className="py-3 px-4 font-medium">{row.trips}</td>
                    <td className="text-right py-3 px-4 font-mono text-emerald-600">
                      {formatCurrency(row.weeklyRevenue)}
                    </td>
                    <td className="text-right py-3 px-4 font-mono">
                      {formatCurrency(row.monthlyRevenue)}
                    </td>
                    <td className="text-right py-3 px-4 font-mono">
                      {formatCurrency(row.annualRevenue)}
                    </td>
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

            {/* Preview */}
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trips/week</span>
                <span className="font-medium">{inputs.numberOfTrips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue/trip</span>
                <span className="font-medium font-mono">{formatCurrency(results.revenuePerTrip)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground">Weekly revenue</span>
                <span className="font-bold text-emerald-600 font-mono">{formatCurrency(results.weeklyRevenue)}</span>
              </div>
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
