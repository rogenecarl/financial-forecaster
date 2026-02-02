import * as XLSX from "xlsx";
import type { ImportInvoice, CreateInvoiceLineItem, InvoiceItemType } from "@/schema/forecasting.schema";

// ============================================
// TYPES
// ============================================

export interface InvoiceParseResult {
  success: boolean;
  invoice: ImportInvoice | null;
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    tourCount: number;
    loadCount: number;
    adjustmentCount: number;
    totalTourPay: number;
    totalAccessorials: number;
    totalAdjustments: number;
    totalPay: number;
  };
}

interface RawInvoiceRow {
  [key: string]: string | number | Date | undefined;
}

// ============================================
// COLUMN MAPPING (Amazon Payment Details Excel)
// ============================================

const columnMappings: Record<string, string[]> = {
  // Trip ID contains the tour identifier (e.g., T-111GTV5BG) in Amazon invoices
  // Block Id column is often empty, so prioritize Trip ID
  tripId: ["trip id", "tripid", "trip_id", "trip", "block id", "blockid", "block_id", "block"],
  // Load ID is the individual load identifier
  loadId: ["load id", "loadid", "load_id", "load"],
  startDate: ["start date", "startdate", "start_date", "start"],
  endDate: ["end date", "enddate", "end_date", "end"],
  operator: ["operator type", "operatortype", "operator", "driver type", "team type"],
  distanceMiles: ["distance (mi)", "distance mi", "distance", "miles", "mi"],
  durationHours: ["duration (hrs)", "duration hrs", "duration", "hours", "hrs"],
  itemType: ["item type", "itemtype", "item_type", "type", "category"],
  baseRate: ["base rate", "baserate", "base_rate", "base", "dtr", "tour rate"],
  fuelSurcharge: ["fuel surcharge", "fuelsurcharge", "fuel_surcharge", "fuel", "accessorial"],
  detention: ["detention", "det"],
  tonu: ["tonu", "truck ordered not used", "cancelled"],
  grossPay: ["gross pay", "grosspay", "gross_pay", "gross", "total", "pay"],
  comments: ["comments", "comment", "notes", "note"],
};

function normalizeColumnName(col: string): string {
  // Normalize: lowercase, trim, replace underscores/hyphens with spaces, collapse multiple spaces
  return col.toLowerCase().trim().replace(/[_-]/g, " ").replace(/\s+/g, " ");
}

function mapColumns(headers: string[]): { mapping: Record<string, string>; unmapped: string[] } {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  const unmapped: string[] = [];

  for (const [field, aliases] of Object.entries(columnMappings)) {
    let found = false;
    for (const alias of aliases) {
      const index = normalizedHeaders.indexOf(alias);
      if (index !== -1) {
        mapping[field] = headers[index];
        found = true;
        break;
      }
      // Also try partial match for columns with extra text
      const partialIndex = normalizedHeaders.findIndex(h => h.includes(alias) || alias.includes(h));
      if (partialIndex !== -1 && !found) {
        mapping[field] = headers[partialIndex];
        found = true;
        break;
      }
    }
    if (!found) {
      unmapped.push(field);
    }
  }

  return { mapping, unmapped };
}

// ============================================
// PARSING UTILITIES
// ============================================

function parseDate(value: string | number | Date | undefined): Date | null {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Excel serial number
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  // String date
  const str = String(value).trim();

  // Try various formats
  const formats = [
    // "Jan 14, 2026"
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    // "01/14/2026"
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // "2026-01-14"
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      // Month name format
      if (/^[A-Za-z]/.test(match[1])) {
        const date = new Date(str);
        if (!isNaN(date.getTime())) return date;
      }
      // Numeric formats
      else {
        let year: number, month: number, day: number;

        if (match[1].length === 4) {
          // YYYY-MM-DD
          [, year, month, day] = match.map(Number) as [string, number, number, number];
        } else {
          // MM/DD/YYYY
          [, month, day, year] = match.map(Number) as [string, number, number, number];
        }

        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  // Fallback to native parsing
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(value: string | number | Date | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return 0; // Dates shouldn't be parsed as numbers

  let str = String(value).trim();
  str = str.replace(/[$,]/g, "");

  // Handle parentheses for negative: (100.00) -> -100.00
  const parenMatch = str.match(/^\(([0-9.]+)\)$/);
  if (parenMatch) {
    return -parseFloat(parenMatch[1]);
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseItemType(value: string | undefined): InvoiceItemType {
  if (!value) return "LOAD_COMPLETED";

  const v = value.toString().toLowerCase().trim();

  if (v.includes("tour") && v.includes("completed")) return "TOUR_COMPLETED";
  if (v.includes("load") && v.includes("completed")) return "LOAD_COMPLETED";
  if (v.includes("adjustment") && v.includes("dispute")) return "ADJUSTMENT_DISPUTE";
  if (v.includes("adjustment")) return "ADJUSTMENT_OTHER";

  // Default based on content
  if (v.includes("tour")) return "TOUR_COMPLETED";
  if (v.includes("load")) return "LOAD_COMPLETED";

  return "LOAD_COMPLETED";
}

// ============================================
// INVOICE NUMBER EXTRACTION
// ============================================

function extractInvoiceNumber(workbook: XLSX.WorkBook): string {
  // Try to find invoice number in the first sheet or a summary sheet
  const sheetName = workbook.SheetNames.find(
    name => name.toLowerCase().includes("summary")
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  // Look in common locations for invoice number
  const possibleCells = ["A1", "B1", "A2", "B2", "C1", "D1"];

  for (const cell of possibleCells) {
    const value = sheet[cell]?.v;
    if (value && typeof value === "string") {
      // Look for invoice number pattern (AZNG...)
      const match = value.match(/AZNG[A-Z0-9]+/i);
      if (match) return match[0];
    }
  }

  // Generate a unique invoice number if not found
  return `INV-${Date.now()}`;
}

// ============================================
// MAIN PARSER
// ============================================

export function parseInvoiceExcel(buffer: ArrayBuffer): InvoiceParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lineItems: CreateInvoiceLineItem[] = [];

  let totalRows = 0;
  let tourCount = 0;
  let loadCount = 0;
  let adjustmentCount = 0;
  let totalTourPay = 0;
  let totalAccessorials = 0;
  let totalAdjustments = 0;

  try {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        invoice: null,
        errors: ["Excel file has no sheets"],
        warnings: [],
        stats: {
          totalRows: 0,
          tourCount: 0,
          loadCount: 0,
          adjustmentCount: 0,
          totalTourPay: 0,
          totalAccessorials: 0,
          totalAdjustments: 0,
          totalPay: 0,
        },
      };
    }

    // Find "Payment Details" sheet (preferred) or use first sheet
    const paymentDetailsSheet = workbook.SheetNames.find(
      name => name.toLowerCase().includes("payment details") ||
              name.toLowerCase().includes("details")
    );
    const sheetName = paymentDetailsSheet || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON - use defval to preserve columns with empty values in first row
    // Without this, columns like "Load ID", "Start Date", "End Date" get dropped
    // because Tour rows have empty values for these columns
    const data = XLSX.utils.sheet_to_json<RawInvoiceRow>(sheet, {
      raw: false,
      dateNF: "yyyy-mm-dd",
      defval: "",
    });

    if (data.length === 0) {
      return {
        success: false,
        invoice: null,
        errors: ["Sheet is empty"],
        warnings: [],
        stats: {
          totalRows: 0,
          tourCount: 0,
          loadCount: 0,
          adjustmentCount: 0,
          totalTourPay: 0,
          totalAccessorials: 0,
          totalAdjustments: 0,
          totalPay: 0,
        },
      };
    }

    // Get column mapping
    const headers = Object.keys(data[0]);
    const { mapping: columnMap } = mapColumns(headers);

    // Validate required columns
    if (!columnMap.tripId && !columnMap.grossPay) {
      return {
        success: false,
        invoice: null,
        errors: [`Missing required columns. Found: ${headers.join(", ")}`],
        warnings,
        stats: {
          totalRows: 0,
          tourCount: 0,
          loadCount: 0,
          adjustmentCount: 0,
          totalTourPay: 0,
          totalAccessorials: 0,
          totalAdjustments: 0,
          totalPay: 0,
        },
      };
    }

    totalRows = data.length;

    // Track dates for period calculation
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    let skippedRows = 0;

    // Parse each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      const getValue = (field: string): string | number | Date | undefined => {
        const col = columnMap[field];
        return col ? row[col] : undefined;
      };

      const tripId = getValue("tripId")?.toString().trim();
      if (!tripId) {
        skippedRows++;
        continue;
      }

      const loadId = getValue("loadId")?.toString().trim() || null;
      const startDate = parseDate(getValue("startDate"));
      const endDate = parseDate(getValue("endDate"));
      const itemType = parseItemType(getValue("itemType")?.toString());

      // Track date range
      if (startDate) {
        if (!minDate || startDate < minDate) minDate = startDate;
        if (!maxDate || startDate > maxDate) maxDate = startDate;
      }

      const baseRate = parseNumber(getValue("baseRate"));
      const fuelSurcharge = parseNumber(getValue("fuelSurcharge"));
      const detention = parseNumber(getValue("detention"));
      const tonu = parseNumber(getValue("tonu"));
      const grossPay = parseNumber(getValue("grossPay"));

      // Categorize and count
      if (itemType === "TOUR_COMPLETED") {
        tourCount++;
        totalTourPay += grossPay;
      } else if (itemType === "LOAD_COMPLETED") {
        loadCount++;
        totalAccessorials += grossPay;
      } else {
        adjustmentCount++;
        totalAdjustments += grossPay;
      }

      const lineItem: CreateInvoiceLineItem = {
        tripId,
        loadId,
        startDate,
        endDate,
        operator: getValue("operator")?.toString() || null,
        distanceMiles: parseNumber(getValue("distanceMiles")),
        durationHours: parseNumber(getValue("durationHours")),
        itemType,
        baseRate,
        fuelSurcharge,
        detention,
        tonu,
        grossPay,
        comments: getValue("comments")?.toString() || null,
      };

      lineItems.push(lineItem);
    }

    // Extract invoice number
    const invoiceNumber = extractInvoiceNumber(workbook);

    const totalPay = totalTourPay + totalAccessorials + totalAdjustments;

    // Only warn if all rows were skipped (likely a mapping issue)
    if (skippedRows > 0 && lineItems.length === 0) {
      warnings.push(`All ${skippedRows} rows were skipped due to missing Trip ID. Please check your file format.`);
    }

    const invoice: ImportInvoice = {
      invoiceNumber,
      routeDomicile: null,
      equipment: null,
      programType: null,
      periodStart: minDate,
      periodEnd: maxDate,
      paymentDate: null,
      lineItems,
    };

    return {
      success: errors.length === 0 || lineItems.length > 0,
      invoice,
      errors,
      warnings,
      stats: {
        totalRows,
        tourCount,
        loadCount,
        adjustmentCount,
        totalTourPay,
        totalAccessorials,
        totalAdjustments,
        totalPay,
      },
    };
  } catch (err) {
    return {
      success: false,
      invoice: null,
      errors: [err instanceof Error ? err.message : "Failed to parse Excel file"],
      warnings: [],
      stats: {
        totalRows: 0,
        tourCount: 0,
        loadCount: 0,
        adjustmentCount: 0,
        totalTourPay: 0,
        totalAccessorials: 0,
        totalAdjustments: 0,
        totalPay: 0,
      },
    };
  }
}

// ============================================
// FILE PARSER
// ============================================

export async function parseInvoiceFile(file: File): Promise<InvoiceParseResult> {
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return {
      success: false,
      invoice: null,
      errors: [`Unsupported file type: ${file.name}. Please upload an Excel file (.xlsx or .xls)`],
      warnings: [],
      stats: {
        totalRows: 0,
        tourCount: 0,
        loadCount: 0,
        adjustmentCount: 0,
        totalTourPay: 0,
        totalAccessorials: 0,
        totalAdjustments: 0,
        totalPay: 0,
      },
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    return parseInvoiceExcel(buffer);
  } catch (err) {
    return {
      success: false,
      invoice: null,
      errors: [err instanceof Error ? err.message : "Failed to read file"],
      warnings: [],
      stats: {
        totalRows: 0,
        tourCount: 0,
        loadCount: 0,
        adjustmentCount: 0,
        totalTourPay: 0,
        totalAccessorials: 0,
        totalAdjustments: 0,
        totalPay: 0,
      },
    };
  }
}
