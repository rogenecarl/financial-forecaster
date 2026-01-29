import Papa from "papaparse";
import { format } from "date-fns";
import type { TransactionExportData } from "@/actions/reports/report-data";

// ============================================
// GENERATE TRANSACTIONS CSV
// ============================================

export function generateTransactionsCsv(data: TransactionExportData): void {
  const csvData = data.transactions.map((txn) => ({
    "Posting Date": txn.postingDate,
    Description: txn.description,
    Amount: txn.amount,
    Type: txn.type,
    Category: txn.category,
    "Category Type": txn.categoryType,
    "Review Status": txn.reviewStatus,
  }));

  const csv = Papa.unparse(csvData);

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // Generate filename
  let filename = "Transactions";
  if (data.period.startDate && data.period.endDate) {
    filename += `_${format(data.period.startDate, "MMM_d")}_to_${format(data.period.endDate, "MMM_d_yyyy")}`;
  } else {
    filename += `_${format(new Date(), "MMM_yyyy")}`;
  }
  filename += ".csv";

  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// GENERATE GENERIC CSV
// ============================================

export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const csv = Papa.unparse(data);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
