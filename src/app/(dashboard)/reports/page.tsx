import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Truck,
} from "lucide-react";

export default function ReportsPage() {
  const reports = [
    {
      title: "Weekly P&L Report",
      description: "Profit and loss summary by week",
      icon: FileText,
      action: "Generate",
    },
    {
      title: "Monthly Summary",
      description: "Monthly financial overview",
      icon: Calendar,
      action: "Generate",
    },
    {
      title: "Forecast Accuracy",
      description: "Compare forecasts vs actual results",
      icon: TrendingUp,
      action: "Generate",
    },
    {
      title: "Revenue by Trip",
      description: "Detailed trip-level revenue breakdown",
      icon: Truck,
      action: "Generate",
    },
    {
      title: "Expense Categories",
      description: "Expenses grouped by category",
      icon: DollarSign,
      action: "Generate",
    },
    {
      title: "Cash Flow Statement",
      description: "Cash inflows and outflows",
      icon: BarChart3,
      action: "Generate",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export financial reports
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  {report.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State Message */}
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Reports require data
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Import transactions and invoices to generate meaningful reports.
              Reports will be available once you have financial data in the system.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No reports generated yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
