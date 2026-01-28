import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportTransactionRow } from "@/schema/transaction.schema";

// ============================================
// TYPES
// ============================================

export interface ParseResult {
  success: boolean;
  transactions: ImportTransactionRow[];
  errors: string[];
  warnings: string[];
  detectedFormat: string;
}

interface RawBankRow {
  [key: string]: string | number | undefined;
}

// ============================================
// COLUMN MAPPING
// ============================================

// Map common column name variations to our schema
const columnMappings: Record<string, string[]> = {
  details: ["details", "detail", "type", "transaction type", "trans type"],
  postingDate: ["posting date", "postingdate", "date", "transaction date", "trans date", "post date"],
  description: ["description", "desc", "memo", "narrative", "transaction description", "payee"],
  amount: ["amount", "transaction amount", "trans amount", "debit/credit", "value"],
  type: ["type", "category", "transaction category", "method", "payment type"],
  balance: ["balance", "running balance", "account balance", "available balance"],
  checkOrSlipNum: ["check or slip #", "check number", "check #", "slip #", "reference", "ref", "check no"],
};

function normalizeColumnName(col: string): string {
  return col.toLowerCase().trim().replace(/[_-]/g, " ");
}

function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));

  for (const [field, aliases] of Object.entries(columnMappings)) {
    for (const alias of aliases) {
      const index = normalizedHeaders.indexOf(alias);
      if (index !== -1) {
        mapping[field] = headers[index];
        break;
      }
    }
  }

  return mapping;
}

// ============================================
// DATE PARSING
// ============================================

function parseDate(value: string | number | undefined): Date | null {
  if (!value) return null;

  // Handle Excel serial dates
  if (typeof value === "number") {
    // Excel dates are days since 1900-01-01 (with a bug for 1900 being a leap year)
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  const str = String(value).trim();

  // Try various date formats
  const formats = [
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      let year: number, month: number, day: number;

      if (match[1].length === 4) {
        // YYYY-MM-DD
        [, year, month, day] = match.map(Number) as [string, number, number, number];
      } else if (match[3].length === 4) {
        // MM/DD/YYYY or DD-MM-YYYY or MM-DD-YYYY
        [, month, day, year] = match.map(Number) as [string, number, number, number];
      } else {
        continue;
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try native parsing as fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

// ============================================
// AMOUNT PARSING
// ============================================

function parseAmount(value: string | number | undefined, details?: string): number {
  if (value === undefined || value === null || value === "") return 0;

  if (typeof value === "number") {
    return value;
  }

  let str = String(value).trim();

  // Remove currency symbols and thousands separators
  str = str.replace(/[$,]/g, "");

  // Handle parentheses for negative numbers: (100.00) -> -100.00
  const parenMatch = str.match(/^\(([0-9.]+)\)$/);
  if (parenMatch) {
    return -parseFloat(parenMatch[1]);
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  // If details indicates DEBIT, make amount negative
  if (details) {
    const d = details.toUpperCase();
    if ((d === "DEBIT" || d === "CHECK") && num > 0) {
      return -num;
    }
  }

  return num;
}

// ============================================
// ROW PARSING
// ============================================

function parseRow(
  row: RawBankRow,
  columnMap: Record<string, string>,
  rowIndex: number
): { transaction: ImportTransactionRow | null; error: string | null } {
  try {
    const getValue = (field: string): string | number | undefined => {
      const col = columnMap[field];
      return col ? row[col] : undefined;
    };

    const details = String(getValue("details") || "DEBIT").toUpperCase();
    const postingDateRaw = getValue("postingDate");
    const description = String(getValue("description") || "");
    const amountRaw = getValue("amount");
    const type = String(getValue("type") || deriveType(details, description));
    const balanceRaw = getValue("balance");
    const checkOrSlipNum = getValue("checkOrSlipNum");

    // Parse posting date
    const postingDate = parseDate(postingDateRaw);
    if (!postingDate) {
      return {
        transaction: null,
        error: `Row ${rowIndex + 1}: Invalid or missing date "${postingDateRaw}"`
      };
    }

    // Parse amount
    const amount = parseAmount(amountRaw, details);
    if (amount === 0 && !amountRaw) {
      return {
        transaction: null,
        error: `Row ${rowIndex + 1}: Missing amount`
      };
    }

    // Parse balance (optional)
    const balance = balanceRaw !== undefined ? parseAmount(balanceRaw) : null;

    // Validate description
    if (!description || description.trim() === "") {
      return {
        transaction: null,
        error: `Row ${rowIndex + 1}: Missing description`
      };
    }

    const transaction: ImportTransactionRow = {
      details: normalizeDetails(details),
      postingDate,
      description: description.trim(),
      amount,
      type: normalizeType(type),
      balance,
      checkOrSlipNum: checkOrSlipNum ? String(checkOrSlipNum) : null,
    };

    return { transaction, error: null };
  } catch (err) {
    return {
      transaction: null,
      error: `Row ${rowIndex + 1}: ${err instanceof Error ? err.message : "Unknown error"}`
    };
  }
}

// ============================================
// TYPE DERIVATION
// ============================================

function normalizeDetails(details: string): string {
  const d = details.toUpperCase().trim();
  if (d.includes("CREDIT")) return "CREDIT";
  if (d.includes("DEBIT")) return "DEBIT";
  if (d.includes("CHECK")) return "CHECK";
  if (d.includes("DSLIP") || d.includes("DEPOSIT")) return "DSLIP";
  return "DEBIT"; // Default
}

function normalizeType(type: string): string {
  const t = type.toUpperCase().trim();

  // Map common types
  if (t.includes("ACH") && t.includes("CREDIT")) return "ACH_CREDIT";
  if (t.includes("ACH") && t.includes("DEBIT")) return "ACH_DEBIT";
  if (t.includes("ACH")) return "ACH_DEBIT";
  if (t.includes("DEBIT") && t.includes("CARD")) return "DEBIT_CARD";
  if (t.includes("WIRE")) return "WIRE_TRANSFER";
  if (t.includes("CHECK")) return "CHECK";
  if (t.includes("ATM")) return "ATM";
  if (t.includes("TRANSFER")) return "TRANSFER";
  if (t.includes("FEE")) return "FEE";

  return t || "OTHER";
}

function deriveType(details: string, description: string): string {
  const d = details.toUpperCase();
  const desc = description.toUpperCase();

  if (d === "CHECK") return "CHECK";
  if (d === "DSLIP") return "DEPOSIT";

  if (desc.includes("ACH")) {
    return d === "CREDIT" ? "ACH_CREDIT" : "ACH_DEBIT";
  }

  if (desc.includes("DEBIT CARD") || desc.includes("POS")) {
    return "DEBIT_CARD";
  }

  if (desc.includes("WIRE")) return "WIRE_TRANSFER";
  if (desc.includes("ATM")) return "ATM";
  if (desc.includes("FEE") || desc.includes("SERVICE CHARGE")) return "FEE";

  return d === "CREDIT" ? "CREDIT" : "DEBIT";
}

// ============================================
// CSV PARSING
// ============================================

export function parseCSV(content: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: ImportTransactionRow[] = [];

  try {
    const result = Papa.parse<RawBankRow>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      for (const err of result.errors) {
        if (err.type === "FieldMismatch") {
          warnings.push(`Row ${err.row}: Field count mismatch`);
        } else {
          errors.push(`Parse error at row ${err.row}: ${err.message}`);
        }
      }
    }

    if (!result.meta.fields || result.meta.fields.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: ["Could not detect column headers"],
        warnings: [],
        detectedFormat: "unknown",
      };
    }

    const columnMap = mapColumns(result.meta.fields);

    // Check required columns
    const requiredFields = ["postingDate", "description", "amount"];
    const missingFields = requiredFields.filter(f => !columnMap[f]);

    if (missingFields.length > 0) {
      return {
        success: false,
        transactions: [],
        errors: [`Missing required columns: ${missingFields.join(", ")}. Found columns: ${result.meta.fields.join(", ")}`],
        warnings: [],
        detectedFormat: "unknown",
      };
    }

    // Parse each row
    for (let i = 0; i < result.data.length; i++) {
      const { transaction, error } = parseRow(result.data[i], columnMap, i);
      if (transaction) {
        transactions.push(transaction);
      } else if (error) {
        errors.push(error);
      }
    }

    return {
      success: errors.length === 0 || transactions.length > 0,
      transactions,
      errors,
      warnings,
      detectedFormat: "CSV",
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [err instanceof Error ? err.message : "Failed to parse CSV"],
      warnings: [],
      detectedFormat: "CSV",
    };
  }
}

// ============================================
// EXCEL PARSING
// ============================================

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: ImportTransactionRow[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: ["Excel file has no sheets"],
        warnings: [],
        detectedFormat: "XLSX",
      };
    }

    // Use first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<RawBankRow>(sheet, {
      raw: false,
      dateNF: "yyyy-mm-dd",
    });

    if (data.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: ["Excel sheet is empty"],
        warnings: [],
        detectedFormat: "XLSX",
      };
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    const columnMap = mapColumns(headers);

    // Check required columns
    const requiredFields = ["postingDate", "description", "amount"];
    const missingFields = requiredFields.filter(f => !columnMap[f]);

    if (missingFields.length > 0) {
      return {
        success: false,
        transactions: [],
        errors: [`Missing required columns: ${missingFields.join(", ")}. Found columns: ${headers.join(", ")}`],
        warnings: [],
        detectedFormat: "XLSX",
      };
    }

    // Parse each row
    for (let i = 0; i < data.length; i++) {
      const { transaction, error } = parseRow(data[i], columnMap, i);
      if (transaction) {
        transactions.push(transaction);
      } else if (error) {
        errors.push(error);
      }
    }

    return {
      success: errors.length === 0 || transactions.length > 0,
      transactions,
      errors,
      warnings,
      detectedFormat: "XLSX",
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [err instanceof Error ? err.message : "Failed to parse Excel file"],
      warnings: [],
      detectedFormat: "XLSX",
    };
  }
}

// ============================================
// UNIFIED PARSER
// ============================================

export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
    const content = await file.text();
    return parseCSV(content);
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    return parseExcel(buffer);
  }

  return {
    success: false,
    transactions: [],
    errors: [`Unsupported file type: ${file.name}. Supported formats: CSV, XLSX, XLS`],
    warnings: [],
    detectedFormat: "unknown",
  };
}

// ============================================
// TEXT PASTE PARSING
// ============================================

export function parseText(text: string): ParseResult {
  // Try to detect if it's tab-separated or comma-separated
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return {
      success: false,
      transactions: [],
      errors: ["Text must contain at least a header row and one data row"],
      warnings: [],
      detectedFormat: "unknown",
    };
  }

  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  // Convert tabs to commas if tab-separated
  if (tabCount > commaCount) {
    const csvContent = lines.map(line =>
      line.split("\t").map(cell => {
        // Quote cells that contain commas
        if (cell.includes(",")) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(",")
    ).join("\n");

    return parseCSV(csvContent);
  }

  return parseCSV(text);
}
