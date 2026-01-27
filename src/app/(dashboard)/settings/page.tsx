import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  ListChecks,
  DollarSign,
  MapPin,
  Bot,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure categories, rules, and preferences
          </p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Categories</CardTitle>
              </div>
              <CardDescription>
                Manage transaction categories for P&L reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-medium">Amazon Payout</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Driver Wages</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Expense</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="font-medium">Payroll Taxes</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Expense</span>
                </div>
                <Button variant="outline" className="w-full mt-2">
                  Manage Categories
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categorization Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Categorization Rules</CardTitle>
              </div>
              <CardDescription>
                Automatic transaction categorization rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">AMAZON.COM SERVICES</p>
                    <p className="text-xs text-muted-foreground">Contains → Amazon Payout</p>
                  </div>
                  <span className="text-xs text-muted-foreground">24 hits</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">ADP WAGE PAY</p>
                    <p className="text-xs text-muted-foreground">Contains → Driver Wages</p>
                  </div>
                  <span className="text-xs text-muted-foreground">12 hits</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">ADP Tax</p>
                    <p className="text-xs text-muted-foreground">Contains → Payroll Taxes</p>
                  </div>
                  <span className="text-xs text-muted-foreground">12 hits</span>
                </div>
                <Button variant="outline" className="w-full mt-2">
                  Manage Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Default Values */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Forecasting Defaults</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Daily Tractor Rate (DTR)</label>
                <div className="text-lg font-semibold">$452.00</div>
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Average Accessorial Rate</label>
                <div className="text-lg font-semibold">$77.00</div>
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Default Truck Count</label>
                <div className="text-lg font-semibold">2</div>
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Hourly Wage</label>
                <div className="text-lg font-semibold">$20.00</div>
              </div>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Hours per Night</label>
                <div className="text-lg font-semibold">10</div>
              </div>
            </CardContent>
          </Card>

          {/* Excluded Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Excluded Addresses</CardTitle>
              </div>
              <CardDescription>
                Excluded from load counting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                  MSP7
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                  MSP8
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                  MSP9
                </span>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <CardTitle>AI Categorization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable AI auto-categorization</span>
                <div className="w-10 h-6 rounded-full bg-primary relative">
                  <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence threshold</span>
                  <span className="font-medium">80%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div className="h-2 w-4/5 bg-primary rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Transactions above this threshold are auto-categorized
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
