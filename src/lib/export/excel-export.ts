import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { ForecastExportData, PLReportData } from "@/actions/reports/report-data";

// ============================================
// HELPERS
// ============================================

function formatCurrencyPlain(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// ============================================
// GENERATE FORECAST EXCEL
// ============================================

export function generateForecastExcel(data: ForecastExportData): void {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ["Forecast vs Actual Summary"],
    [],
    ["Period", data.period.startDate ? format(data.period.startDate, "MMM d, yyyy") + " - " + (data.period.endDate ? format(data.period.endDate, "MMM d, yyyy") : "Present") : "All Data"],
    ["Generated", format(new Date(), "MMM d, yyyy 'at' h:mm a")],
    [],
    ["Summary Metrics"],
    ["Total Projected", formatCurrencyPlain(data.summary.totalProjected)],
    ["Total Actual", data.summary.totalActual !== null ? formatCurrencyPlain(data.summary.totalActual) : "N/A"],
    ["Total Variance", data.summary.totalVariance !== null ? formatCurrencyPlain(data.summary.totalVariance) : "N/A"],
    ["Average Accuracy", data.summary.averageAccuracy !== null ? `${Math.round(data.summary.averageAccuracy)}%` : "N/A"],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 25 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Weekly Breakdown Sheet
  const weeklyHeaders = [
    "Week",
    "Week Start",
    "Week End",
    "Projected Tours",
    "Projected Loads",
    "Projected Tour Pay",
    "Projected Accessorials",
    "Projected Total",
    "Actual Tours",
    "Actual Loads",
    "Actual Tour Pay",
    "Actual Accessorials",
    "Actual Adjustments",
    "Actual Total",
    "Variance",
    "Variance %",
    "Accuracy %",
  ];

  const weeklyData = data.weeks.map((week) => [
    week.weekLabel,
    format(week.weekStart, "yyyy-MM-dd"),
    format(week.weekEnd, "yyyy-MM-dd"),
    week.projectedTours,
    week.projectedLoads,
    formatCurrencyPlain(week.projectedTourPay),
    formatCurrencyPlain(week.projectedAccessorials),
    formatCurrencyPlain(week.projectedTotal),
    week.actualTours ?? "",
    week.actualLoads ?? "",
    week.actualTourPay !== null ? formatCurrencyPlain(week.actualTourPay) : "",
    week.actualAccessorials !== null ? formatCurrencyPlain(week.actualAccessorials) : "",
    week.actualAdjustments !== null ? formatCurrencyPlain(week.actualAdjustments) : "",
    week.actualTotal !== null ? formatCurrencyPlain(week.actualTotal) : "",
    week.variance !== null ? formatCurrencyPlain(week.variance) : "",
    week.variancePercent !== null ? `${week.variancePercent.toFixed(1)}%` : "",
    week.accuracy !== null ? `${week.accuracy}%` : "",
  ]);

  const weeklySheet = XLSX.utils.aoa_to_sheet([weeklyHeaders, ...weeklyData]);

  // Set column widths for weekly sheet
  weeklySheet["!cols"] = [
    { wch: 25 }, // Week
    { wch: 12 }, // Week Start
    { wch: 12 }, // Week End
    { wch: 15 }, // Projected Tours
    { wch: 15 }, // Projected Loads
    { wch: 18 }, // Projected Tour Pay
    { wch: 20 }, // Projected Accessorials
    { wch: 16 }, // Projected Total
    { wch: 12 }, // Actual Tours
    { wch: 12 }, // Actual Loads
    { wch: 15 }, // Actual Tour Pay
    { wch: 18 }, // Actual Accessorials
    { wch: 18 }, // Actual Adjustments
    { wch: 14 }, // Actual Total
    { wch: 12 }, // Variance
    { wch: 12 }, // Variance %
    { wch: 12 }, // Accuracy %
  ];

  XLSX.utils.book_append_sheet(workbook, weeklySheet, "Weekly Breakdown");

  // Save
  const filename = `Forecast_Summary_${format(new Date(), "MMM_yyyy")}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// ============================================
// GENERATE P&L EXCEL
// ============================================

export function generatePLExcel(data: PLReportData): void {
  const workbook = XLSX.utils.book_new();

  // Header rows
  const sheetData: (string | number | null)[][] = [
    ["Profit & Loss Statement"],
    [data.companyName],
    [data.period.label],
    [`Generated: ${format(data.generatedAt, "MMM d, yyyy 'at' h:mm a")}`],
    [],
    ["REVENUE"],
    ["Category", "Transactions", "Amount"],
  ];

  // Revenue items
  for (const item of data.revenue.items) {
    sheetData.push([item.categoryName, item.transactionCount, formatCurrencyPlain(item.amount)]);
  }
  sheetData.push(["Total Revenue", "", formatCurrencyPlain(data.revenue.total)]);

  sheetData.push([]);
  sheetData.push(["EXPENSES"]);
  sheetData.push(["Category", "Transactions", "Amount"]);

  // Expense items
  for (const item of data.expenses.items) {
    sheetData.push([item.categoryName, item.transactionCount, formatCurrencyPlain(Math.abs(item.amount))]);
  }
  sheetData.push(["Total Expenses", "", formatCurrencyPlain(data.expenses.total)]);

  sheetData.push([]);
  sheetData.push(["SUMMARY"]);
  sheetData.push(["Total Revenue", "", formatCurrencyPlain(data.revenue.total)]);
  sheetData.push(["Total Expenses", "", formatCurrencyPlain(data.expenses.total)]);
  sheetData.push(["Net Profit / (Loss)", "", formatCurrencyPlain(data.netProfit)]);
  sheetData.push(["Profit Margin", "", `${data.profitMargin.toFixed(1)}%`]);

  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

  sheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(workbook, sheet, "P&L Statement");

  // Save
  const filename =
    data.period.type === "week"
      ? `PL_Week_${format(data.period.startDate, "MMM_d_yyyy")}.xlsx`
      : `PL_${format(data.period.startDate, "MMMM_yyyy")}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
