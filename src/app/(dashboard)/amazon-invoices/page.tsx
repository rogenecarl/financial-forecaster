"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Upload, FileSpreadsheet, Trash2, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import { InvoiceImportModal } from "@/components/forecasting";
import { useAmazonInvoices, useAmazonInvoiceDetail } from "@/hooks";

export default function AmazonInvoicesPage() {
  const [showImport, setShowImport] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query hooks
  const {
    invoices,
    stats,
    isLoading: loading,
    deleteInvoice,
    isDeleting: deleting,
    invalidate,
  } = useAmazonInvoices();

  const { invoice: selectedInvoice, isLoading: loadingDetails } = useAmazonInvoiceDetail(selectedInvoiceId);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteInvoice(deleteId);
    setDeleteId(null);
    if (selectedInvoiceId === deleteId) {
      setSelectedInvoiceId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDateRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return "-";
    return `${format(new Date(start), "MMM d")} - ${format(new Date(end), "MMM d")}`;
  };

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
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Invoice
          </Button>
        </div>
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
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : stats.totalInvoices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tour Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalTourPay)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accessorials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalAccessorials)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalPay)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      {invoices.length > 0 || loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and manage imported Amazon invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-center">Tours</TableHead>
                    <TableHead className="text-right">Total Pay</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedInvoiceId === invoice.id ? "bg-muted/50" : ""
                        }`}
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                      >
                        <TableCell className="font-mono text-sm">
                          {invoice.invoiceNumber.length > 20
                            ? `${invoice.invoiceNumber.substring(0, 20)}...`
                            : invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {formatDateRange(invoice.periodStart, invoice.periodEnd)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {invoice.tourCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-emerald-600">
                          {formatCurrency(invoice.totalPay)}
                        </TableCell>
                        <TableCell className="text-center">
                          {invoice.isMatched ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle className="h-3 w-3" />
                              Matched
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(invoice.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and manage imported Amazon invoices</CardDescription>
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
              <Button onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details */}
      {(selectedInvoice || loadingDetails) && (
        <Card>
          <CardHeader>
            <CardTitle>
              Invoice Details{selectedInvoice && `: ${selectedInvoice.invoiceNumber}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDetails ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedInvoice ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tour Pay</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedInvoice.totalTourPay)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedInvoice.lineItems?.filter((li) => li.itemType === "TOUR_COMPLETED").length || 0} tours
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Accessorials</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedInvoice.totalAccessorials)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedInvoice.lineItems?.filter((li) => li.itemType === "LOAD_COMPLETED").length || 0} loads
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Adjustments</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedInvoice.totalAdjustments)}</p>
                    <p className="text-xs text-muted-foreground">TONU, disputes</p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-700">Total Pay</p>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedInvoice.totalPay)}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trip ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Miles</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Fuel Sur.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.lineItems?.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.loadId ? `└ ${item.loadId}` : item.tripId}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.itemType === "TOUR_COMPLETED"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.itemType === "LOAD_COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.itemType === "TOUR_COMPLETED"
                                ? "Tour"
                                : item.itemType === "LOAD_COMPLETED"
                                ? "Load"
                                : "Adjustment"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.distanceMiles > 0 ? item.distanceMiles.toFixed(1) : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.baseRate > 0 ? formatCurrency(item.baseRate) : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.fuelSurcharge > 0 ? formatCurrency(item.fuelSurcharge) : "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(item.grossPay)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing 20 of {selectedInvoice.lineItems.length} line items
                  </p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Import Modal */}
      <InvoiceImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={invalidate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
