import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Receipt, FileQuestion } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Track and categorize your bank transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Transactions</CardTitle>
          <CardDescription>
            Import your bank statement to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No transactions yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Import your bank transactions to get started with bookkeeping.
              We support CSV and Excel files.
            </p>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future filters and table */}
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-muted-foreground">
            <FileQuestion className="h-5 w-5 mr-2" />
            <span>Filters and transaction table will appear here after import</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
