"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { ImportInvoice, AmazonInvoice, AmazonInvoiceLineItem } from "@/schema/forecasting.schema";
import { importInvoiceSchema } from "@/schema/forecasting.schema";

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
): Promise<ActionResponse<{ invoiceId: string; lineItemCount: number }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validated = importInvoiceSchema.parse(data);

    // Check for duplicate invoice number
    const existing = await prisma.amazonInvoice.findFirst({
      where: {
        userId: session.user.id,
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
        userId: session.user.id,
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

    // Try to update ForecastWeek with actual data
    if (validated.periodStart && validated.periodEnd) {
      await updateForecastWeekActuals(session.user.id, invoice.id, {
        periodStart: validated.periodStart,
        periodEnd: validated.periodEnd,
        totalTourPay,
        totalAccessorials,
        totalAdjustments,
        totalPay,
        tourCount: validated.lineItems.filter((i) => i.itemType === "TOUR_COMPLETED").length,
        loadCount: validated.lineItems.filter((i) => i.itemType === "LOAD_COMPLETED").length,
      });
    }

    return {
      success: true,
      data: {
        invoiceId: invoice.id,
        lineItemCount: validated.lineItems.length,
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
// UPDATE FORECAST WEEK WITH ACTUALS
// ============================================

async function updateForecastWeekActuals(
  userId: string,
  invoiceId: string,
  data: {
    periodStart: Date;
    periodEnd: Date;
    totalTourPay: number;
    totalAccessorials: number;
    totalAdjustments: number;
    totalPay: number;
    tourCount: number;
    loadCount: number;
  }
) {
  try {
    // Find the ForecastWeek that matches the invoice period
    const forecastWeek = await prisma.forecastWeek.findFirst({
      where: {
        userId,
        weekStart: {
          lte: data.periodEnd,
        },
        weekEnd: {
          gte: data.periodStart,
        },
      },
    });

    if (forecastWeek) {
      const variance = data.totalPay - toNumber(forecastWeek.projectedTotal);
      const variancePercent = toNumber(forecastWeek.projectedTotal) !== 0
        ? (variance / toNumber(forecastWeek.projectedTotal)) * 100
        : null;

      await prisma.forecastWeek.update({
        where: { id: forecastWeek.id },
        data: {
          actualTours: data.tourCount,
          actualLoads: data.loadCount,
          actualTourPay: data.totalTourPay,
          actualAccessorials: data.totalAccessorials,
          actualAdjustments: data.totalAdjustments,
          actualTotal: data.totalPay,
          variance,
          variancePercent,
          amazonInvoiceId: invoiceId,
          status: "COMPLETED",
        },
      });
    }
  } catch (error) {
    console.error("Failed to update forecast week with actuals:", error);
    // Don't throw - this is a secondary operation
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
