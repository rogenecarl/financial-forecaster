"use client";

import { useState, useMemo } from "react";
import { format, endOfWeek } from "date-fns";
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
import { InvoiceImportModal, InvoiceDetailsTable } from "@/components/forecasting";
import { WeekSelector } from "@/components/filters";
import { useAmazonInvoices, useAmazonInvoiceDetail, useWeekOptions } from "@/hooks";
import { getWeekStartFromId } from "@/lib/week-utils";

export default function AmazonInvoicesPage() {
  const [showImport, setShowImport] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Phase 3 filter state
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  // Filter hooks
  const { weeks, isLoading: weeksLoading } = useWeekOptions();

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

  // Get selected week info for display
  const selectedWeek = weeks.find((w) => w.id === selectedWeekId);

  // Filter invoices by week (client-side filtering)
  const filteredInvoices = useMemo(() => {
    if (!selectedWeekId) return invoices;

    const weekStart = getWeekStartFromId(selectedWeekId);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    // Filter invoices that overlap with the selected week
    return invoices.filter((invoice) => {
      if (!invoice.periodStart || !invoice.periodEnd) return true;
      const invoiceStart = new Date(invoice.periodStart);
      const invoiceEnd = new Date(invoice.periodEnd);
      // Check for overlap: invoice period overlaps with week if:
      // invoiceStart <= weekEnd AND invoiceEnd >= weekStart
      return invoiceStart <= weekEnd && invoiceEnd >= weekStart;
    });
  }, [invoices, selectedWeekId]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    if (!selectedWeekId) return stats;

    return {
      totalInvoices: filteredInvoices.length,
      totalTourPay: filteredInvoices.reduce((sum, inv) => sum + inv.totalTourPay, 0),
      totalAccessorials: filteredInvoices.reduce((sum, inv) => sum + inv.totalAccessorials, 0),
      totalPay: filteredInvoices.reduce((sum, inv) => sum + inv.totalPay, 0),
    };
  }, [filteredInvoices, stats, selectedWeekId]);

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

  const hasActiveFilters = selectedWeekId !== null;

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

      {/* Phase 3 Filters */}
      <div className="flex flex-wrap gap-2">
        <WeekSelector
          weeks={weeks}
          selectedWeekId={selectedWeekId}
          onWeekChange={setSelectedWeekId}
          loading={weeksLoading}
        />
      </div>

      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtering by:</span>
          {selectedWeek && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
              Week {selectedWeek.weekNumber}: {selectedWeek.label}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setSelectedWeekId(null)}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters ? "Filtered Invoices" : "Total Invoices"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : filteredStats.totalInvoices}
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
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(filteredStats.totalTourPay)}
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
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(filteredStats.totalAccessorials)}
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
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(filteredStats.totalPay)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length > 0 || loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              {hasActiveFilters
                ? `Showing ${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? "s" : ""} overlapping with selected week`
                : "View and manage imported Amazon invoices"}
            </CardDescription>
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
                    filteredInvoices.map((invoice) => (
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
                {hasActiveFilters ? "No invoices for selected week" : "No invoices imported"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {hasActiveFilters
                  ? "No invoices found that overlap with the selected week. Try selecting a different week or clear the filter."
                  : "Import your Amazon Payment Details to track actual earnings and compare with forecasts."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={() => setSelectedWeekId(null)}>
                  Clear Filter
                </Button>
              ) : (
                <Button onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Invoice
                </Button>
              )}
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

                {/* Line Items Table with Accordion */}
                <InvoiceDetailsTable
                  lineItems={selectedInvoice.lineItems || []}
                  loading={false}
                />
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
