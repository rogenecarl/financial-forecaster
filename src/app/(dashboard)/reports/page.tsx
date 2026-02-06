"use client";

import { useState, useCallback } from "react";
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

import type { WeekOption, MonthOption, QuarterOption } from "@/actions/reports/report-data";
import {
  useGenerateWeeklyPL,
  useGenerateMonthlyPL,
  useExportTransactions,
  useExportForecast,
  useGenerateCPAPackage,
} from "@/hooks";

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

  // Mutation hooks
  const weeklyPL = useGenerateWeeklyPL();
  const monthlyPL = useGenerateMonthlyPL();
  const transactionsExport = useExportTransactions();
  const forecastExport = useExportForecast();
  const cpaPackage = useGenerateCPAPackage();

  // Recent exports (stored in localStorage)
  const [recentExports, setRecentExports] = useState<RecentExport[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("recentExports");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((e: RecentExport) => ({
          ...e,
          generatedAt: new Date(e.generatedAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

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

  const handleGenerateWeeklyPL = () => {
    if (!selectedWeek) {
      toast.error("Please select a week");
      return;
    }
    weeklyPL.generate(selectedWeek, {
      onSuccess: () => addRecentExport(`PL_Week_${selectedWeek.label}.pdf`, "pdf"),
    });
  };

  const handleGenerateMonthlyPL = () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }
    monthlyPL.generate(selectedMonth, {
      onSuccess: () => addRecentExport(`PL_${selectedMonth.label}.pdf`, "pdf"),
    });
  };

  const handleExportTransactions = () => {
    transactionsExport.exportData(
      {
        startDate: transactionDateRange.startDate || undefined,
        endDate: transactionDateRange.endDate || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      },
      {
        onSuccess: () => addRecentExport(`Transactions_Export.csv`, "csv"),
      }
    );
  };

  const handleExportForecast = () => {
    forecastExport.exportData(
      {
        startDate: forecastDateRange.startDate || undefined,
        endDate: forecastDateRange.endDate || undefined,
      },
      {
        onSuccess: () => addRecentExport(`Forecast_Summary.xlsx`, "xlsx"),
      }
    );
  };

  const handleGenerateCPAPackage = () => {
    if (!selectedQuarter) {
      toast.error("Please select a quarter");
      return;
    }
    cpaPackage.generate(selectedQuarter, {
      onSuccess: () => addRecentExport(`CPA_Package_${selectedQuarter.label}.zip`, "zip"),
    });
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
                  disabled={weeklyPL.isPending}
                />
              </div>
              <Button
                onClick={handleGenerateWeeklyPL}
                disabled={!selectedWeek || weeklyPL.isPending}
              >
                {weeklyPL.isPending ? (
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
                  disabled={monthlyPL.isPending}
                />
              </div>
              <Button
                onClick={handleGenerateMonthlyPL}
                disabled={!selectedMonth || monthlyPL.isPending}
              >
                {monthlyPL.isPending ? (
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
                  disabled={transactionsExport.isPending}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Categories (optional)
                </label>
                <CategorySelector
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  disabled={transactionsExport.isPending}
                />
              </div>
            </div>
            <Button
              onClick={handleExportTransactions}
              disabled={transactionsExport.isPending}
              className="w-full sm:w-auto"
            >
              {transactionsExport.isPending ? (
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
                disabled={forecastExport.isPending}
              />
            </div>
            <Button
              onClick={handleExportForecast}
              disabled={forecastExport.isPending}
              className="w-full sm:w-auto"
            >
              {forecastExport.isPending ? (
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
              disabled={cpaPackage.isPending}
            />
          </div>
          <Button
            onClick={handleGenerateCPAPackage}
            disabled={!selectedQuarter || cpaPackage.isPending}
            size="lg"
          >
            {cpaPackage.isPending ? (
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
