"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { ImportInvoice, AmazonInvoice, AmazonInvoiceLineItem } from "@/schema/forecasting.schema";
import { importInvoiceSchema } from "@/schema/forecasting.schema";
import { startOfWeek, endOfWeek, getWeek, getYear } from "date-fns";

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
    }));

    return { success: true, data: summaries };
  } catch (error) {
    console.error("Failed to get invoices:", error);
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
// IMPORT INVOICE
// ============================================

export async function importAmazonInvoice(
  data: ImportInvoice
): Promise<ActionResponse<{ invoiceId: string; lineItemCount: number; matchedTrips: number }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

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

    // Create invoice with line items
    const invoice = await prisma.amazonInvoice.create({
      data: {
        userId,
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

    // ============================================
    // FIX: Update Trip records with actual data
    // ============================================
    const matchedTrips = await updateTripActualsFromInvoice(userId, validated.lineItems);

    // ============================================
    // FIX: Update ForecastWeeks based on matched trips
    // ============================================
    await recalculateForecastWeeksFromTrips(userId, invoice.id);

    return {
      success: true,
      data: {
        invoiceId: invoice.id,
        lineItemCount: validated.lineItems.length,
        matchedTrips,
      },
    };
  } catch (error) {
    console.error("Failed to import invoice:", error);
    return { success: false, error: "Failed to import invoice" };
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

    // Delete invoice (line items cascade)
    await prisma.amazonInvoice.delete({ where: { id } });

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

    // Find matching Trip records
    const matchingTrips = await prisma.trip.findMany({
      where: {
        userId,
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
// RECALCULATE FORECAST WEEKS FROM TRIPS
// ============================================

async function recalculateForecastWeeksFromTrips(
  userId: string,
  invoiceId: string
): Promise<void> {
  try {
    // Get all trips that have actual data (actualRevenue is not null)
    const tripsWithActuals = await prisma.trip.findMany({
      where: {
        userId,
        actualRevenue: { not: null },
      },
      select: {
        id: true,
        tripId: true,
        scheduledDate: true,
        projectedLoads: true,
        actualLoads: true,
        projectedRevenue: true,
        actualRevenue: true,
        estimatedAccessorial: true,
        tripStage: true,
      },
    });

    if (tripsWithActuals.length === 0) {
      return;
    }

    // Group trips by week (based on scheduledDate)
    const weekMap = new Map<number, typeof tripsWithActuals>();

    for (const trip of tripsWithActuals) {
      const weekStart = startOfWeek(trip.scheduledDate, { weekStartsOn: 1 });
      const weekKey = weekStart.getTime();

      const existing = weekMap.get(weekKey) || [];
      existing.push(trip);
      weekMap.set(weekKey, existing);
    }

    // Update each ForecastWeek with aggregated actuals from its trips
    for (const [weekStartTime, trips] of weekMap) {
      const weekStart = new Date(weekStartTime);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
      const year = getYear(weekStart);

      // Calculate actuals from trips
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
          // Tour pay is $452, rest is accessorials
          actualTourPay += 452;
          actualAccessorials += Math.max(0, tripActualRevenue - 452);
        } else if (trip.tripStage === "CANCELED" && tripActualRevenue > 0) {
          // TONU or other adjustment
          actualAdjustments += tripActualRevenue;
        }

        actualLoads += tripActualLoads;
      }

      const actualTotal = actualTourPay + actualAccessorials + actualAdjustments;

      // Find or create the ForecastWeek
      const forecastWeek = await prisma.forecastWeek.findFirst({
        where: { userId, weekStart },
      });

      if (forecastWeek) {
        const projectedTotal = toNumber(forecastWeek.projectedTotal);
        const variance = actualTotal - projectedTotal;
        const variancePercent = projectedTotal !== 0
          ? (variance / projectedTotal) * 100
          : null;

        await prisma.forecastWeek.update({
          where: { id: forecastWeek.id },
          data: {
            actualTours,
            actualLoads,
            actualTourPay,
            actualAccessorials,
            actualAdjustments,
            actualTotal,
            variance,
            variancePercent,
            amazonInvoiceId: invoiceId,
            status: "COMPLETED",
          },
        });
      } else {
        // Create new ForecastWeek if it doesn't exist
        // First, get projected data from trips in this week
        const allTripsInWeek = await prisma.trip.findMany({
          where: {
            userId,
            scheduledDate: { gte: weekStart, lte: weekEnd },
          },
        });

        const projectedTours = allTripsInWeek.length;
        const projectedLoads = allTripsInWeek.reduce((sum, t) => sum + t.projectedLoads, 0);
        const projectedTourPay = projectedTours * 452;
        const projectedAccessorials = allTripsInWeek.reduce(
          (sum, t) => sum + toNumber(t.estimatedAccessorial),
          0
        );
        const projectedTotal = projectedTourPay + projectedAccessorials;

        const variance = actualTotal - projectedTotal;
        const variancePercent = projectedTotal !== 0
          ? (variance / projectedTotal) * 100
          : null;

        await prisma.forecastWeek.create({
          data: {
            userId,
            weekStart,
            weekEnd,
            weekNumber,
            year,
            projectedTours,
            projectedLoads,
            projectedTourPay,
            projectedAccessorials,
            projectedTotal,
            actualTours,
            actualLoads,
            actualTourPay,
            actualAccessorials,
            actualAdjustments,
            actualTotal,
            variance,
            variancePercent,
            amazonInvoiceId: invoiceId,
            status: "COMPLETED",
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to recalculate forecast weeks:", error);
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
