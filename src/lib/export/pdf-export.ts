import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { PLReportData } from "@/actions/reports/report-data";

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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================
// GENERATE P&L PDF
// ============================================

export function generatePLPdf(data: PLReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Profit & Loss Statement", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(data.companyName, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(11);
  doc.text(data.period.label, pageWidth / 2, 35, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${format(data.generatedAt, "MMM d, yyyy 'at' h:mm a")}`,
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

  if (data.revenue.items.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Transactions", "Amount"]],
      body: data.revenue.items.map((item) => [
        item.categoryName,
        item.transactionCount.toString(),
        formatCurrency(item.amount),
      ]),
      foot: [["Total Revenue", "", formatCurrency(data.revenue.total)]],
      theme: "striped",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: "bold",
      },
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
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("No revenue recorded for this period", 14, yPos + 5);
    yPos += 20;
  }

  // Expenses Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXPENSES", 14, yPos);
  yPos += 5;

  if (data.expenses.items.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Transactions", "Amount"]],
      body: data.expenses.items.map((item) => [
        item.categoryName,
        item.transactionCount.toString(),
        formatCurrency(Math.abs(item.amount)),
      ]),
      foot: [["Total Expenses", "", formatCurrency(data.expenses.total)]],
      theme: "striped",
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: "bold",
      },
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
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("No expenses recorded for this period", 14, yPos + 5);
    yPos += 20;
  }

  // Summary Section
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SUMMARY", 14, yPos);
  yPos += 8;

  const summaryData = [
    ["Total Revenue", formatCurrency(data.revenue.total)],
    ["Total Expenses", `(${formatCurrency(data.expenses.total)})`],
    [
      "Net Profit / (Loss)",
      data.netProfit >= 0
        ? formatCurrency(data.netProfit)
        : `(${formatCurrency(Math.abs(data.netProfit))})`,
    ],
    ["Profit Margin", formatPercent(data.profitMargin)],
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
    didParseCell: (data) => {
      // Highlight net profit row
      if (data.row.index === 2) {
        data.cell.styles.fillColor =
          data.cell.raw === summaryData[2][1] && !String(data.cell.raw).includes("(")
            ? [220, 252, 231]
            : [254, 226, 226];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "This report is for internal use only.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  const filename =
    data.period.type === "week"
      ? `PL_Week_${format(data.period.startDate, "MMM_d_yyyy")}.pdf`
      : `PL_${format(data.period.startDate, "MMMM_yyyy")}.pdf`;

  doc.save(filename);
}

// ============================================
// GENERATE FORECAST SUMMARY PDF
// ============================================

export interface ForecastPdfData {
  title: string;
  period: string;
  generatedAt: Date;
  weeks: Array<{
    weekLabel: string;
    projectedTotal: number;
    actualTotal: number | null;
    variance: number | null;
    accuracy: number | null;
  }>;
  summary: {
    totalProjected: number;
    totalActual: number | null;
    totalVariance: number | null;
    averageAccuracy: number | null;
  };
}

export function generateForecastPdf(data: ForecastPdfData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.period, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${format(data.generatedAt, "MMM d, yyyy 'at' h:mm a")}`,
    pageWidth / 2,
    35,
    { align: "center" }
  );

  doc.setTextColor(0);

  // Weekly breakdown table
  autoTable(doc, {
    startY: 45,
    head: [["Week", "Forecast", "Actual", "Variance", "Accuracy"]],
    body: data.weeks.map((week) => [
      week.weekLabel,
      formatCurrency(week.projectedTotal),
      week.actualTotal !== null ? formatCurrency(week.actualTotal) : "-",
      week.variance !== null
        ? (week.variance >= 0 ? "+" : "") + formatCurrency(week.variance)
        : "-",
      week.accuracy !== null ? `${week.accuracy}%` : "-",
    ]),
    foot: [
      [
        "TOTAL",
        formatCurrency(data.summary.totalProjected),
        data.summary.totalActual !== null
          ? formatCurrency(data.summary.totalActual)
          : "-",
        data.summary.totalVariance !== null
          ? (data.summary.totalVariance >= 0 ? "+" : "") +
            formatCurrency(data.summary.totalVariance)
          : "-",
        data.summary.averageAccuracy !== null
          ? `${Math.round(data.summary.averageAccuracy)}%`
          : "-",
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 25, halign: "center" },
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "This report is for internal use only.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  const filename = `Forecast_Summary_${format(new Date(), "MMM_yyyy")}.pdf`;
  doc.save(filename);
}
