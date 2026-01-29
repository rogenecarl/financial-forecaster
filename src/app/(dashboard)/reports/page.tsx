"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Package,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ReportCard } from "@/components/reports/report-card";
import { WeekSelector } from "@/components/reports/week-selector";
import { MonthSelector } from "@/components/reports/month-selector";
import { QuarterSelector } from "@/components/reports/quarter-selector";
import { DateRangeSelector } from "@/components/reports/date-range-selector";
import { CategorySelector } from "@/components/reports/category-selector";

import {
  getPLReportData,
  getTransactionExportData,
  getForecastExportData,
  getCPAPackageData,
  type WeekOption,
  type MonthOption,
  type QuarterOption,
} from "@/actions/reports/report-data";

import { generatePLPdf } from "@/lib/export/pdf-export";
import { generateForecastExcel } from "@/lib/export/excel-export";
import { generateTransactionsCsv } from "@/lib/export/csv-export";
import { generateCPAPackageZip } from "@/lib/export/zip-export";

// ============================================
// TYPES
// ============================================

interface RecentExport {
  id: string;
  filename: string;
  type: "pdf" | "csv" | "xlsx" | "zip";
  generatedAt: Date;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportsPage() {
  // State for selectors
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption | null>(null);
  const [transactionDateRange, setTransactionDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [forecastDateRange, setForecastDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });

  // Loading states
  const [generatingWeeklyPL, setGeneratingWeeklyPL] = useState(false);
  const [generatingMonthlyPL, setGeneratingMonthlyPL] = useState(false);
  const [generatingTransactions, setGeneratingTransactions] = useState(false);
  const [generatingForecast, setGeneratingForecast] = useState(false);
  const [generatingCPA, setGeneratingCPA] = useState(false);

  // Recent exports (stored in localStorage)
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);

  // Load recent exports from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentExports");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentExports(
          parsed.map((e: RecentExport) => ({
            ...e,
            generatedAt: new Date(e.generatedAt),
          }))
        );
      } catch {
        // Ignore invalid stored data
      }
    }
  }, []);

  // Add to recent exports
  const addRecentExport = useCallback(
    (filename: string, type: RecentExport["type"]) => {
      const newExport: RecentExport = {
        id: crypto.randomUUID(),
        filename,
        type,
        generatedAt: new Date(),
      };

      setRecentExports((prev) => {
        const updated = [newExport, ...prev].slice(0, 10); // Keep last 10
        localStorage.setItem("recentExports", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handleGenerateWeeklyPL = async () => {
    if (!selectedWeek) {
      toast.error("Please select a week");
      return;
    }

    setGeneratingWeeklyPL(true);
    try {
      const result = await getPLReportData(
        "week",
        new Date(selectedWeek.weekStart),
        new Date(selectedWeek.weekEnd)
      );

      if (!result.success) {
        toast.error(result.error || "Failed to generate report");
        return;
      }

      generatePLPdf(result.data);
      addRecentExport(`PL_Week_${selectedWeek.label}.pdf`, "pdf");
      toast.success("Weekly P&L Report generated successfully");
    } catch (error) {
      console.error("Error generating weekly P&L:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingWeeklyPL(false);
    }
  };

  const handleGenerateMonthlyPL = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setGeneratingMonthlyPL(true);
    try {
      const result = await getPLReportData(
        "month",
        new Date(selectedMonth.monthStart),
        new Date(selectedMonth.monthEnd)
      );

      if (!result.success) {
        toast.error(result.error || "Failed to generate report");
        return;
      }

      generatePLPdf(result.data);
      addRecentExport(`PL_${selectedMonth.label}.pdf`, "pdf");
      toast.success("Monthly P&L Report generated successfully");
    } catch (error) {
      console.error("Error generating monthly P&L:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingMonthlyPL(false);
    }
  };

  const handleExportTransactions = async () => {
    setGeneratingTransactions(true);
    try {
      const result = await getTransactionExportData(
        transactionDateRange.startDate || undefined,
        transactionDateRange.endDate || undefined,
        selectedCategories.length > 0 ? selectedCategories : undefined
      );

      if (!result.success) {
        toast.error(result.error || "Failed to export transactions");
        return;
      }

      if (result.data.transactions.length === 0) {
        toast.error("No transactions found for the selected filters");
        return;
      }

      generateTransactionsCsv(result.data);
      addRecentExport(`Transactions_Export.csv`, "csv");
      toast.success(`Exported ${result.data.totalCount} transactions`);
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast.error("Failed to export transactions");
    } finally {
      setGeneratingTransactions(false);
    }
  };

  const handleExportForecast = async () => {
    setGeneratingForecast(true);
    try {
      const result = await getForecastExportData(
        forecastDateRange.startDate || undefined,
        forecastDateRange.endDate || undefined
      );

      if (!result.success) {
        toast.error(result.error || "Failed to export forecast data");
        return;
      }

      if (result.data.weeks.length === 0) {
        toast.error("No forecast data found for the selected period");
        return;
      }

      generateForecastExcel(result.data);
      addRecentExport(`Forecast_Summary.xlsx`, "xlsx");
      toast.success(`Exported ${result.data.weeks.length} weeks of forecast data`);
    } catch (error) {
      console.error("Error exporting forecast:", error);
      toast.error("Failed to export forecast data");
    } finally {
      setGeneratingForecast(false);
    }
  };

  const handleGenerateCPAPackage = async () => {
    if (!selectedQuarter) {
      toast.error("Please select a quarter");
      return;
    }

    setGeneratingCPA(true);
    try {
      const result = await getCPAPackageData(selectedQuarter);

      if (!result.success) {
        toast.error(result.error || "Failed to generate CPA package");
        return;
      }

      await generateCPAPackageZip(result.data);
      addRecentExport(`CPA_Package_${selectedQuarter.label}.zip`, "zip");
      toast.success("CPA Package generated successfully");
    } catch (error) {
      console.error("Error generating CPA package:", error);
      toast.error("Failed to generate CPA package");
    } finally {
      setGeneratingCPA(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

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
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly P&L Report */}
        <ReportCard
          title="Weekly P&L Report"
          description="Profit and loss statement for a selected week"
          icon={FileText}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Select Week
                </label>
                <WeekSelector
                  value={selectedWeek}
                  onChange={setSelectedWeek}
                  disabled={generatingWeeklyPL}
                />
              </div>
              <Button
                onClick={handleGenerateWeeklyPL}
                disabled={!selectedWeek || generatingWeeklyPL}
              >
                {generatingWeeklyPL ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </ReportCard>

        {/* Monthly P&L Report */}
        <ReportCard
          title="Monthly P&L Report"
          description="Profit and loss statement for a selected month"
          icon={Calendar}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Select Month
                </label>
                <MonthSelector
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  disabled={generatingMonthlyPL}
                />
              </div>
              <Button
                onClick={handleGenerateMonthlyPL}
                disabled={!selectedMonth || generatingMonthlyPL}
              >
                {generatingMonthlyPL ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </ReportCard>

        {/* Transaction Export */}
        <ReportCard
          title="Transaction Export"
          description="Export all transactions with categories to CSV"
          icon={FileSpreadsheet}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Date Range (optional)
                </label>
                <DateRangeSelector
                  value={transactionDateRange}
                  onChange={setTransactionDateRange}
                  disabled={generatingTransactions}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Categories (optional)
                </label>
                <CategorySelector
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  disabled={generatingTransactions}
                />
              </div>
            </div>
            <Button
              onClick={handleExportTransactions}
              disabled={generatingTransactions}
              className="w-full sm:w-auto"
            >
              {generatingTransactions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </ReportCard>

        {/* Forecast Summary */}
        <ReportCard
          title="Forecast Summary"
          description="Forecast vs actual comparison report"
          icon={TrendingUp}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Date Range (optional)
              </label>
              <DateRangeSelector
                value={forecastDateRange}
                onChange={setForecastDateRange}
                disabled={generatingForecast}
              />
            </div>
            <Button
              onClick={handleExportForecast}
              disabled={generatingForecast}
              className="w-full sm:w-auto"
            >
              {generatingForecast ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
        </ReportCard>
      </div>

      {/* CPA Package - Full Width */}
      <ReportCard
        title="CPA Package"
        description="Bundled reports for your accountant - includes P&L, transactions, and forecast summary"
        icon={Package}
        className="bg-gradient-to-r from-primary/5 to-primary/10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1 block">
              Select Quarter
            </label>
            <QuarterSelector
              value={selectedQuarter}
              onChange={setSelectedQuarter}
              disabled={generatingCPA}
            />
          </div>
          <Button
            onClick={handleGenerateCPAPackage}
            disabled={!selectedQuarter || generatingCPA}
            size="lg"
          >
            {generatingCPA ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            The CPA Package includes:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Profit & Loss Statement (PDF)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Transaction Details (CSV)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Forecast vs Actual Summary (Excel)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              README with summary metrics
            </li>
          </ul>
        </div>
      </ReportCard>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>Previously generated reports from this session</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No reports generated yet</p>
              <p className="text-xs mt-1">
                Generated reports will appear here for reference
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExports.map((export_) => (
                <div
                  key={export_.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      {export_.type === "pdf" ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : export_.type === "csv" ? (
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                      ) : export_.type === "xlsx" ? (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      ) : (
                        <Package className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{export_.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {export_.generatedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase">
                    {export_.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
