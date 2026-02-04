"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { ImportInvoice, AmazonInvoice, AmazonInvoiceLineItem } from "@/schema/forecasting.schema";
import { importInvoiceSchema } from "@/schema/forecasting.schema";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";

// ============================================
// TYPES
// ============================================

export type InvoiceWithLineItems = AmazonInvoice & {
  lineItems: AmazonInvoiceLineItem[];
};

export type InvoiceSummary = Pick<
  AmazonInvoice,
  | "id"
  | "invoiceNumber"
  | "totalTourPay"
  | "totalAccessorials"
  | "totalAdjustments"
  | "totalPay"
  | "periodStart"
  | "periodEnd"
  | "paymentDate"
  | "createdAt"
> & {
  tourCount: number;
  loadCount: number;
  isMatched: boolean;
  batchId: string | null;
  batchName: string | null;
};

// ============================================
// HELPERS
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

function mapInvoiceItemType(type: string): "TOUR_COMPLETED" | "LOAD_COMPLETED" | "ADJUSTMENT_DISPUTE" | "ADJUSTMENT_OTHER" {
  switch (type) {
    case "TOUR_COMPLETED":
      return "TOUR_COMPLETED";
    case "LOAD_COMPLETED":
      return "LOAD_COMPLETED";
    case "ADJUSTMENT_DISPUTE":
      return "ADJUSTMENT_DISPUTE";
    default:
      return "ADJUSTMENT_OTHER";
  }
}

// ============================================
// CHECK DUPLICATE FILE (for batch import)
// ============================================

export interface DuplicateInvoiceFileCheckResult {
  isDuplicate: boolean;
  batchName?: string;
  importedAt?: Date;
}

export async function checkDuplicateInvoiceFile(
  batchId: string,
  fileHash: string
): Promise<ActionResponse<DuplicateInvoiceFileCheckResult>> {
  try {
    const session = await requireAuth();

    // Check if this file was imported to any batch
    const existingBatch = await prisma.tripBatch.findFirst({
      where: {
        userId: session.user.id,
        invoiceFileHash: fileHash,
        id: { not: batchId },
      },
      select: {
        name: true,
        invoiceImportedAt: true,
      },
    });

    if (existingBatch) {
      return {
        success: true,
        data: {
          isDuplicate: true,
          batchName: existingBatch.name,
          importedAt: existingBatch.invoiceImportedAt || undefined,
        },
      };
    }

    return {
      success: true,
      data: { isDuplicate: false },
    };
  } catch (error) {
    console.error("Failed to check duplicate file:", error);
    return { success: false, error: "Failed to check for duplicate file" };
  }
}

// ============================================
// GET INVOICES
// ============================================

export async function getAmazonInvoices(): Promise<ActionResponse<InvoiceSummary[]>> {
  try {
    const session = await requireAuth();

    const invoices = await prisma.amazonInvoice.findMany({
      where: { userId: session.user.id },
      orderBy: { paymentDate: "desc" },
      include: {
        lineItems: {
          select: { itemType: true },
        },
        transactions: {
          select: { id: true },
        },
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    const summaries: InvoiceSummary[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalTourPay: toNumber(invoice.totalTourPay),
      totalAccessorials: toNumber(invoice.totalAccessorials),
      totalAdjustments: toNumber(invoice.totalAdjustments),
      totalPay: toNumber(invoice.totalPay),
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paymentDate: invoice.paymentDate,
      createdAt: invoice.createdAt,
      tourCount: invoice.lineItems.filter((li) => li.itemType === "TOUR_COMPLETED").length,
      loadCount: invoice.lineItems.filter((li) => li.itemType === "LOAD_COMPLETED").length,
      isMatched: invoice.transactions.length > 0,
      batchId: invoice.batch?.id || null,
      batchName: invoice.batch?.name || null,
    }));

    return { success: true, data: summaries };
  } catch (error) {
    console.error("Failed to get invoices:", error);
    return { success: false, error: "Failed to load invoices" };
  }
}

// ============================================
// GET INVOICES FOR BATCH
// ============================================

export async function getInvoicesForBatch(batchId: string): Promise<ActionResponse<InvoiceSummary[]>> {
  try {
    const session = await requireAuth();

    const invoices = await prisma.amazonInvoice.findMany({
      where: { userId: session.user.id, batchId },
      orderBy: { paymentDate: "desc" },
      include: {
        lineItems: {
          select: { itemType: true },
        },
        transactions: {
          select: { id: true },
        },
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    const summaries: InvoiceSummary[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalTourPay: toNumber(invoice.totalTourPay),
      totalAccessorials: toNumber(invoice.totalAccessorials),
      totalAdjustments: toNumber(invoice.totalAdjustments),
      totalPay: toNumber(invoice.totalPay),
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paymentDate: invoice.paymentDate,
      createdAt: invoice.createdAt,
      tourCount: invoice.lineItems.filter((li) => li.itemType === "TOUR_COMPLETED").length,
      loadCount: invoice.lineItems.filter((li) => li.itemType === "LOAD_COMPLETED").length,
      isMatched: invoice.transactions.length > 0,
      batchId: invoice.batch?.id || null,
      batchName: invoice.batch?.name || null,
    }));

    return { success: true, data: summaries };
  } catch (error) {
    console.error("Failed to get invoices for batch:", error);
    return { success: false, error: "Failed to load invoices" };
  }
}

// ============================================
// GET INVOICE BY ID
// ============================================

export async function getAmazonInvoice(id: string): Promise<ActionResponse<InvoiceWithLineItems>> {
  try {
    const session = await requireAuth();

    const invoice = await prisma.amazonInvoice.findFirst({
      where: { id, userId: session.user.id },
      include: {
        lineItems: {
          orderBy: [{ tripId: "asc" }, { itemType: "asc" }],
        },
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    const result: InvoiceWithLineItems = {
      id: invoice.id,
      userId: invoice.userId,
      batchId: invoice.batchId,
      invoiceNumber: invoice.invoiceNumber,
      routeDomicile: invoice.routeDomicile,
      equipment: invoice.equipment,
      programType: invoice.programType,
      totalTourPay: toNumber(invoice.totalTourPay),
      totalAccessorials: toNumber(invoice.totalAccessorials),
      totalAdjustments: toNumber(invoice.totalAdjustments),
      totalPay: toNumber(invoice.totalPay),
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paymentDate: invoice.paymentDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      lineItems: invoice.lineItems.map((li) => ({
        id: li.id,
        invoiceId: li.invoiceId,
        tripId: li.tripId,
        loadId: li.loadId,
        startDate: li.startDate,
        endDate: li.endDate,
        operator: li.operator,
        distanceMiles: toNumber(li.distanceMiles),
        durationHours: toNumber(li.durationHours),
        itemType: li.itemType,
        baseRate: toNumber(li.baseRate),
        fuelSurcharge: toNumber(li.fuelSurcharge),
        detention: toNumber(li.detention),
        tonu: toNumber(li.tonu),
        grossPay: toNumber(li.grossPay),
        comments: li.comments,
        createdAt: li.createdAt,
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get invoice:", error);
    return { success: false, error: "Failed to load invoice" };
  }
}

// ============================================
// IMPORT INVOICE TO BATCH
// ============================================

export interface InvoiceImportResult {
  invoiceId: string;
  batchId: string;
  lineItemCount: number;
  matchedTrips: number;
  unmatchedTrips: number;
}

export async function importInvoiceToBatch(
  batchId: string,
  data: ImportInvoice,
  fileHash?: string
): Promise<ActionResponse<InvoiceImportResult>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify batch exists and belongs to user
    const batch = await prisma.tripBatch.findFirst({
      where: { id: batchId, userId },
    });

    if (!batch) {
      return { success: false, error: "Batch not found" };
    }

    // Validate input
    const validated = importInvoiceSchema.parse(data);

    // Check for duplicate invoice number
    const existing = await prisma.amazonInvoice.findFirst({
      where: {
        userId,
        invoiceNumber: validated.invoiceNumber,
      },
    });

    if (existing) {
      return { success: false, error: `Invoice ${validated.invoiceNumber} already exists` };
    }

    // Check if same file was imported before (by hash)
    if (fileHash) {
      const previousBatch = await prisma.tripBatch.findFirst({
        where: {
          userId,
          invoiceFileHash: fileHash,
          id: { not: batchId },
        },
      });

      if (previousBatch) {
        return {
          success: false,
          error: `DUPLICATE_FILE: This file was already imported to batch "${previousBatch.name}"`,
        };
      }
    }

    // Calculate totals
    let totalTourPay = 0;
    let totalAccessorials = 0;
    let totalAdjustments = 0;

    for (const item of validated.lineItems) {
      if (item.itemType === "TOUR_COMPLETED") {
        totalTourPay += item.grossPay;
      } else if (item.itemType === "LOAD_COMPLETED") {
        totalAccessorials += item.grossPay;
      } else {
        totalAdjustments += item.grossPay;
      }
    }

    const totalPay = totalTourPay + totalAccessorials + totalAdjustments;

    // Pre-check which trips will match (within this batch)
    const uniqueTripIds = [...new Set(validated.lineItems.map((li) => li.tripId))];
    const matchingTrips = await prisma.trip.findMany({
      where: { userId, batchId, tripId: { in: uniqueTripIds } },
      select: { tripId: true },
    });
    const matchingTripIds = new Set(matchingTrips.map((t) => t.tripId));
    const unmatchedCount = uniqueTripIds.filter((id) => !matchingTripIds.has(id)).length;

    // Create invoice with line items
    const invoice = await prisma.amazonInvoice.create({
      data: {
        userId,
        batchId,
        invoiceNumber: validated.invoiceNumber,
        routeDomicile: validated.routeDomicile || null,
        equipment: validated.equipment || null,
        programType: validated.programType || null,
        totalTourPay,
        totalAccessorials,
        totalAdjustments,
        totalPay,
        periodStart: validated.periodStart || null,
        periodEnd: validated.periodEnd || null,
        paymentDate: validated.paymentDate || null,
        lineItems: {
          create: validated.lineItems.map((item) => ({
            tripId: item.tripId,
            loadId: item.loadId || null,
            startDate: item.startDate || null,
            endDate: item.endDate || null,
            operator: item.operator || null,
            distanceMiles: item.distanceMiles,
            durationHours: item.durationHours,
            itemType: mapInvoiceItemType(item.itemType),
            baseRate: item.baseRate,
            fuelSurcharge: item.fuelSurcharge,
            detention: item.detention,
            tonu: item.tonu,
            grossPay: item.grossPay,
            comments: item.comments || null,
          })),
        },
      },
    });

    // Update Trip records with actual data (only trips in this batch)
    const matchedTripsCount = await updateTripActualsFromInvoice(userId, batchId, validated.lineItems);

    // Update TripBatch with actual metrics and LOCK projections
    await recalculateBatchActualsFromInvoice(batchId, invoice.id, fileHash);

    return {
      success: true,
      data: {
        invoiceId: invoice.id,
        batchId,
        lineItemCount: validated.lineItems.length,
        matchedTrips: matchedTripsCount,
        unmatchedTrips: unmatchedCount,
      },
    };
  } catch (error) {
    console.error("Failed to import invoice to batch:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to import invoice" };
  }
}

// ============================================
// DELETE INVOICE
// ============================================

export async function deleteAmazonInvoice(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();

    const invoice = await prisma.amazonInvoice.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    const batchId = invoice.batchId;

    // Delete invoice (line items cascade)
    await prisma.amazonInvoice.delete({ where: { id } });

    // If invoice was linked to a batch, recalculate batch metrics
    if (batchId) {
      // Reset batch actuals since invoice is deleted
      await prisma.tripBatch.update({
        where: { id: batchId },
        data: {
          status: "COMPLETED", // Revert to completed (no invoice)
          invoiceFileHash: null,
          invoiceImportedAt: null,
          actualTours: null,
          actualLoads: null,
          actualTourPay: null,
          actualAccessorials: null,
          actualAdjustments: null,
          actualTotal: null,
          variance: null,
          variancePercent: null,
          projectionLockedAt: null,
        },
      });

      // Reset trip actuals in this batch
      await prisma.trip.updateMany({
        where: { batchId },
        data: {
          actualLoads: null,
          actualRevenue: null,
        },
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return { success: false, error: "Failed to delete invoice" };
  }
}

// ============================================
// UPDATE TRIP ACTUALS FROM INVOICE
// ============================================

interface LineItemForMatching {
  tripId: string;
  itemType: string;
  grossPay: number;
}

async function updateTripActualsFromInvoice(
  userId: string,
  batchId: string,
  lineItems: LineItemForMatching[]
): Promise<number> {
  try {
    // Group line items by tripId
    const tripDataMap = new Map<string, {
      tourPay: number;
      loadCount: number;
      accessorials: number;
      adjustments: number;
      totalPay: number;
      isAdjustmentOnly: boolean;
    }>();

    for (const item of lineItems) {
      const existing = tripDataMap.get(item.tripId) || {
        tourPay: 0,
        loadCount: 0,
        accessorials: 0,
        adjustments: 0,
        totalPay: 0,
        isAdjustmentOnly: true,
      };

      if (item.itemType === "TOUR_COMPLETED") {
        existing.tourPay += item.grossPay;
        existing.isAdjustmentOnly = false;
      } else if (item.itemType === "LOAD_COMPLETED") {
        existing.loadCount += 1;
        existing.accessorials += item.grossPay;
        existing.isAdjustmentOnly = false;
      } else {
        // Adjustments (TONU, disputes, etc.)
        existing.adjustments += item.grossPay;
      }

      existing.totalPay += item.grossPay;
      tripDataMap.set(item.tripId, existing);
    }

    // Get all tripIds to match
    const tripIds = [...tripDataMap.keys()];

    // Find matching Trip records (only within this batch)
    const matchingTrips = await prisma.trip.findMany({
      where: {
        userId,
        batchId,
        tripId: { in: tripIds },
      },
      select: { id: true, tripId: true, tripStage: true },
    });

    const tripIdToDbId = new Map(matchingTrips.map((t) => [t.tripId, { id: t.id, stage: t.tripStage }]));

    // Update each matching Trip with actual data
    let matchedCount = 0;

    for (const [tripId, data] of tripDataMap) {
      const tripRecord = tripIdToDbId.get(tripId);
      if (tripRecord) {
        // Determine the new trip stage
        let newStage = tripRecord.stage;
        if (data.isAdjustmentOnly && data.adjustments > 0) {
          // Trip was canceled but got TONU payment - keep as CANCELED
          newStage = "CANCELED";
        } else if (!data.isAdjustmentOnly) {
          // Trip was completed (has tour or load items)
          newStage = "COMPLETED";
        }

        await prisma.trip.update({
          where: { id: tripRecord.id },
          data: {
            actualLoads: data.loadCount,
            actualRevenue: data.totalPay,
            tripStage: newStage,
          },
        });
        matchedCount++;
      }
    }

    return matchedCount;
  } catch (error) {
    console.error("Failed to update trip actuals from invoice:", error);
    return 0;
  }
}

// ============================================
// RECALCULATE BATCH ACTUALS FROM INVOICE
// ============================================

async function recalculateBatchActualsFromInvoice(
  batchId: string,
  invoiceId: string,
  fileHash?: string
): Promise<void> {
  try {
    // Get all trips for this batch with their actual data
    const trips = await prisma.trip.findMany({
      where: { batchId },
      select: {
        tripStage: true,
        actualLoads: true,
        actualRevenue: true,
      },
    });

    // Get batch for projected data
    const batch = await prisma.tripBatch.findFirst({
      where: { id: batchId },
    });

    if (!batch) return;

    // Calculate actuals from trips
    const { DTR_RATE } = FORECASTING_CONSTANTS;
    let actualTours = 0;
    let actualLoads = 0;
    let actualTourPay = 0;
    let actualAccessorials = 0;
    let actualAdjustments = 0;

    for (const trip of trips) {
      const tripActualRevenue = toNumber(trip.actualRevenue);
      const tripActualLoads = trip.actualLoads || 0;

      // Count completed tours (not adjustments-only)
      if (trip.tripStage === "COMPLETED") {
        actualTours++;
        // Estimate tour pay vs accessorials from actual revenue
        // Tour pay is DTR_RATE, rest is accessorials
        actualTourPay += DTR_RATE;
        actualAccessorials += Math.max(0, tripActualRevenue - DTR_RATE);
      } else if (trip.tripStage === "CANCELED" && tripActualRevenue > 0) {
        // TONU or other adjustment
        actualAdjustments += tripActualRevenue;
      }

      actualLoads += tripActualLoads;
    }

    const actualTotal = actualTourPay + actualAccessorials + actualAdjustments;
    const projectedTotal = toNumber(batch.projectedTotal);
    const variance = actualTotal - projectedTotal;
    const variancePercent = projectedTotal !== 0 ? (variance / projectedTotal) * 100 : null;

    // Update batch with actuals and LOCK projections
    await prisma.tripBatch.update({
      where: { id: batchId },
      data: {
        status: "INVOICED",
        invoiceFileHash: fileHash || null,
        invoiceImportedAt: new Date(),
        actualTours,
        actualLoads,
        actualTourPay,
        actualAccessorials,
        actualAdjustments,
        actualTotal,
        variance,
        variancePercent,
        projectionLockedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to recalculate batch actuals:", error);
  }
}

// ============================================
// GET INVOICE STATS
// ============================================

export async function getInvoiceStats(): Promise<
  ActionResponse<{
    totalInvoices: number;
    totalTourPay: number;
    totalAccessorials: number;
    totalPay: number;
  }>
> {
  try {
    const session = await requireAuth();

    const stats = await prisma.amazonInvoice.aggregate({
      where: { userId: session.user.id },
      _count: { id: true },
      _sum: {
        totalTourPay: true,
        totalAccessorials: true,
        totalPay: true,
      },
    });

    return {
      success: true,
      data: {
        totalInvoices: stats._count.id,
        totalTourPay: toNumber(stats._sum.totalTourPay),
        totalAccessorials: toNumber(stats._sum.totalAccessorials),
        totalPay: toNumber(stats._sum.totalPay),
      },
    };
  } catch (error) {
    console.error("Failed to get invoice stats:", error);
    return { success: false, error: "Failed to load stats" };
  }
}

// ============================================
// GET UNMATCHED LINE ITEMS
// ============================================

export interface UnmatchedLineItem {
  tripId: string;
  itemType: string;
  grossPay: number;
  invoiceNumber: string;
}

export interface InvoiceMatchingStats {
  totalInvoicePay: number;
  matchedPay: number;
  unmatchedPay: number;
  matchedCount: number;
  unmatchedCount: number;
  unmatchedItems: UnmatchedLineItem[];
}

export async function getInvoiceMatchingStats(
  invoiceId?: string
): Promise<ActionResponse<InvoiceMatchingStats>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get invoice(s) with line items
    const whereClause = invoiceId
      ? { userId, id: invoiceId }
      : { userId };

    const invoices = await prisma.amazonInvoice.findMany({
      where: whereClause,
      include: {
        lineItems: {
          select: {
            tripId: true,
            itemType: true,
            grossPay: true,
          },
        },
      },
    });

    if (invoices.length === 0) {
      return {
        success: true,
        data: {
          totalInvoicePay: 0,
          matchedPay: 0,
          unmatchedPay: 0,
          matchedCount: 0,
          unmatchedCount: 0,
          unmatchedItems: [],
        },
      };
    }

    // Collect all unique tripIds from line items
    const allTripIds = new Set<string>();
    for (const invoice of invoices) {
      for (const li of invoice.lineItems) {
        allTripIds.add(li.tripId);
      }
    }

    // Find which tripIds exist in Trip table
    const existingTrips = await prisma.trip.findMany({
      where: {
        userId,
        tripId: { in: [...allTripIds] },
      },
      select: { tripId: true },
    });

    const existingTripIds = new Set(existingTrips.map((t) => t.tripId));

    // Calculate matched vs unmatched
    let totalInvoicePay = 0;
    let matchedPay = 0;
    let unmatchedPay = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedItems: UnmatchedLineItem[] = [];

    for (const invoice of invoices) {
      for (const li of invoice.lineItems) {
        const pay = toNumber(li.grossPay);
        totalInvoicePay += pay;

        if (existingTripIds.has(li.tripId)) {
          matchedPay += pay;
          matchedCount++;
        } else {
          unmatchedPay += pay;
          unmatchedCount++;
          unmatchedItems.push({
            tripId: li.tripId,
            itemType: li.itemType,
            grossPay: pay,
            invoiceNumber: invoice.invoiceNumber,
          });
        }
      }
    }

    return {
      success: true,
      data: {
        totalInvoicePay,
        matchedPay,
        unmatchedPay,
        matchedCount,
        unmatchedCount,
        unmatchedItems,
      },
    };
  } catch (error) {
    console.error("Failed to get invoice matching stats:", error);
    return { success: false, error: "Failed to get matching stats" };
  }
}
