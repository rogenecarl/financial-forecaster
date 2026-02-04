import JSZip from "jszip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { format } from "date-fns";
import type { CPAPackageData } from "@/actions/reports/report-data";

// ============================================
// HELPERS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCurrencyPlain(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// ============================================
// GENERATE P&L PDF BLOB
// ============================================

function generatePLPdfBlob(data: CPAPackageData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const plData = data.plStatement;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Profit & Loss Statement", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(plData.companyName, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(11);
  doc.text(data.quarter.label, pageWidth / 2, 35, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${format(plData.generatedAt, "MMM d, yyyy 'at' h:mm a")}`,
    pageWidth / 2,
    42,
    { align: "center" }
  );

  doc.setTextColor(0);
  let yPos = 55;

  // Revenue Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("REVENUE", 14, yPos);
  yPos += 5;

  if (plData.revenue.items.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Transactions", "Amount"]],
      body: plData.revenue.items.map((item) => [
        item.categoryName,
        item.transactionCount.toString(),
        formatCurrency(item.amount),
      ]),
      foot: [["Total Revenue", "", formatCurrency(plData.revenue.total)]],
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 40, halign: "center" },
        2: { cellWidth: 50, halign: "right" },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    yPos += 15;
  }

  // Expenses Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXPENSES", 14, yPos);
  yPos += 5;

  if (plData.expenses.items.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Transactions", "Amount"]],
      body: plData.expenses.items.map((item) => [
        item.categoryName,
        item.transactionCount.toString(),
        formatCurrency(Math.abs(item.amount)),
      ]),
      foot: [["Total Expenses", "", formatCurrency(plData.expenses.total)]],
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 40, halign: "center" },
        2: { cellWidth: 50, halign: "right" },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    yPos += 15;
  }

  // Summary
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SUMMARY", 14, yPos);
  yPos += 8;

  const summaryData = [
    ["Total Revenue", formatCurrency(plData.revenue.total)],
    ["Total Expenses", `(${formatCurrency(plData.expenses.total)})`],
    [
      "Net Profit / (Loss)",
      plData.netProfit >= 0
        ? formatCurrency(plData.netProfit)
        : `(${formatCurrency(Math.abs(plData.netProfit))})`,
    ],
    ["Profit Margin", `${plData.profitMargin.toFixed(1)}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: "plain",
    styles: { fontSize: 11 },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: "bold" },
      1: { cellWidth: 80, halign: "right" },
    },
  });

  return doc.output("blob");
}

// ============================================
// GENERATE TRANSACTIONS CSV BLOB
// ============================================

function generateTransactionsCsvBlob(data: CPAPackageData): Blob {
  const csvData = data.transactions.transactions.map((txn) => ({
    "Posting Date": txn.postingDate,
    Description: txn.description,
    Amount: txn.amount,
    Type: txn.type,
    Category: txn.category,
    "Category Type": txn.categoryType,
    "Review Status": txn.reviewStatus,
  }));

  const csv = Papa.unparse(csvData);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

// ============================================
// GENERATE FORECAST EXCEL BLOB
// ============================================

function generateForecastExcelBlob(data: CPAPackageData): Blob {
  const workbook = XLSX.utils.book_new();
  const forecastData = data.forecastSummary;

  // Summary Sheet
  const summaryData = [
    ["Forecast vs Actual Summary"],
    [],
    ["Quarter", data.quarter.label],
    ["Generated", format(new Date(), "MMM d, yyyy 'at' h:mm a")],
    [],
    ["Summary Metrics"],
    ["Total Projected", formatCurrencyPlain(forecastData.summary.totalProjected)],
    [
      "Total Actual",
      forecastData.summary.totalActual !== null
        ? formatCurrencyPlain(forecastData.summary.totalActual)
        : "N/A",
    ],
    [
      "Total Variance",
      forecastData.summary.totalVariance !== null
        ? formatCurrencyPlain(forecastData.summary.totalVariance)
        : "N/A",
    ],
    [
      "Average Accuracy",
      forecastData.summary.averageAccuracy !== null
        ? `${Math.round(forecastData.summary.averageAccuracy)}%`
        : "N/A",
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Batch Breakdown
  const batchHeaders = [
    "Batch",
    "Projected Total",
    "Actual Total",
    "Variance",
    "Accuracy",
  ];

  const batchData = forecastData.batches.map((batch) => [
    batch.batchName,
    formatCurrencyPlain(batch.projectedTotal),
    batch.actualTotal !== null ? formatCurrencyPlain(batch.actualTotal) : "",
    batch.variance !== null ? formatCurrencyPlain(batch.variance) : "",
    batch.accuracy !== null ? `${batch.accuracy}%` : "",
  ]);

  const batchSheet = XLSX.utils.aoa_to_sheet([batchHeaders, ...batchData]);
  batchSheet["!cols"] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, batchSheet, "Batch Breakdown");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// ============================================
// GENERATE CPA PACKAGE ZIP
// ============================================

export async function generateCPAPackageZip(data: CPAPackageData): Promise<void> {
  const zip = new JSZip();

  // Add P&L PDF
  const plPdfBlob = generatePLPdfBlob(data);
  zip.file(`PL_Statement_${data.quarter.label.replace(" ", "_")}.pdf`, plPdfBlob);

  // Add Transactions CSV
  const transactionsCsvBlob = generateTransactionsCsvBlob(data);
  zip.file(`Transactions_${data.quarter.label.replace(" ", "_")}.csv`, transactionsCsvBlob);

  // Add Forecast Excel
  const forecastExcelBlob = generateForecastExcelBlob(data);
  zip.file(`Forecast_Summary_${data.quarter.label.replace(" ", "_")}.xlsx`, forecastExcelBlob);

  // Add README
  const readmeContent = `CPA Package - ${data.quarter.label}
======================================

Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
Company: Peak Transport LLC

Contents:
---------
1. PL_Statement_${data.quarter.label.replace(" ", "_")}.pdf
   - Profit & Loss Statement for the quarter
   - Revenue and expense breakdown by category

2. Transactions_${data.quarter.label.replace(" ", "_")}.csv
   - All transactions for the quarter
   - Includes: Date, Description, Amount, Category, Status
   - ${data.transactions.totalCount} total transactions

3. Forecast_Summary_${data.quarter.label.replace(" ", "_")}.xlsx
   - Weekly forecast vs actual comparison
   - Summary metrics and accuracy tracking

Summary:
--------
Total Revenue: ${formatCurrency(data.plStatement.revenue.total)}
Total Expenses: ${formatCurrency(data.plStatement.expenses.total)}
Net Profit: ${formatCurrency(data.plStatement.netProfit)}
Profit Margin: ${data.plStatement.profitMargin.toFixed(1)}%

This package was generated by Financial Forecaster.
`;

  zip.file("README.txt", readmeContent);

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `CPA_Package_${data.quarter.label.replace(" ", "_")}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
