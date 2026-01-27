import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, DollarSign, Package } from "lucide-react";

export default function AmazonInvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Amazon Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Import and analyze Amazon payment details
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Import Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tour Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accessorials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">$0.00</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            View and manage imported Amazon invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No invoices imported
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Import your Amazon Payment Details to track actual earnings and compare with forecasts.
            </p>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4 py-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <DollarSign className="h-5 w-5" />
              <span>Tour breakdown</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Package className="h-5 w-5" />
              <span>Load details</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Adjustments</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <DollarSign className="h-5 w-5" />
              <span>Accessorials</span>
            </div>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Select an invoice to view detailed breakdown
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
