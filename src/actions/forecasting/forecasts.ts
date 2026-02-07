"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type { Forecast, CreateForecast, UpdateForecast } from "@/schema/forecasting.schema";
import { createForecastSchema, updateForecastSchema } from "@/schema/forecasting.schema";
import { calculateForecast } from "@/lib/forecast-calculations";

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

function serializeForecast(f: {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  numberOfTrips: number;
  dtrRate: unknown;
  avgAccessorialPerTrip: unknown;
  revenuePerTrip: unknown;
  weeklyRevenue: unknown;
  monthlyRevenue: unknown;
  annualRevenue: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Forecast {
  return {
    id: f.id,
    userId: f.userId,
    name: f.name,
    description: f.description,
    isDefault: f.isDefault,
    numberOfTrips: f.numberOfTrips,
    dtrRate: toNumber(f.dtrRate),
    avgAccessorialPerTrip: toNumber(f.avgAccessorialPerTrip),
    revenuePerTrip: toNumber(f.revenuePerTrip),
    weeklyRevenue: toNumber(f.weeklyRevenue),
    monthlyRevenue: toNumber(f.monthlyRevenue),
    annualRevenue: toNumber(f.annualRevenue),
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

// ============================================
// GET FORECASTS (Saved Scenarios)
// ============================================

export async function getForecasts(): Promise<ActionResponse<Forecast[]>> {
  try {
    const session = await requireAuth();

    const forecasts = await prisma.forecast.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return { success: true, data: forecasts.map(serializeForecast) };
  } catch (error) {
    console.error("Failed to get forecasts:", error);
    return { success: false, error: "Failed to load forecasts" };
  }
}

// ============================================
// GET DEFAULT FORECAST
// ============================================

export async function getDefaultForecast(): Promise<ActionResponse<Forecast | null>> {
  try {
    const session = await requireAuth();

    const forecast = await prisma.forecast.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    });

    if (!forecast) {
      return { success: true, data: null };
    }

    return { success: true, data: serializeForecast(forecast) };
  } catch (error) {
    console.error("Failed to get default forecast:", error);
    return { success: false, error: "Failed to load forecast" };
  }
}

// ============================================
// CREATE FORECAST
// ============================================

export async function createForecast(data: CreateForecast): Promise<ActionResponse<Forecast>> {
  try {
    const session = await requireAuth();

    const validated = createForecastSchema.parse(data);

    // Calculate results
    const results = calculateForecast(validated);

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.forecast.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const forecast = await prisma.forecast.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        description: validated.description || null,
        isDefault: validated.isDefault,
        numberOfTrips: validated.numberOfTrips,
        dtrRate: validated.dtrRate,
        avgAccessorialPerTrip: validated.avgAccessorialPerTrip,
        revenuePerTrip: results.revenuePerTrip,
        weeklyRevenue: results.weeklyRevenue,
        monthlyRevenue: results.monthlyRevenue,
        annualRevenue: results.annualRevenue,
      },
    });

    return { success: true, data: serializeForecast(forecast) };
  } catch (error) {
    console.error("Failed to create forecast:", error);
    return { success: false, error: "Failed to create forecast" };
  }
}

// ============================================
// UPDATE FORECAST
// ============================================

export async function updateForecast(data: UpdateForecast): Promise<ActionResponse<Forecast>> {
  try {
    const session = await requireAuth();

    const validated = updateForecastSchema.parse(data);

    const existing = await prisma.forecast.findFirst({
      where: { id: validated.id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Forecast not found" };
    }

    // Calculate new results
    const results = calculateForecast({
      numberOfTrips: validated.numberOfTrips ?? existing.numberOfTrips,
      dtrRate: validated.dtrRate ?? toNumber(existing.dtrRate),
      avgAccessorialPerTrip: validated.avgAccessorialPerTrip ?? toNumber(existing.avgAccessorialPerTrip),
    });

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.forecast.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: validated.id } },
        data: { isDefault: false },
      });
    }

    const forecast = await prisma.forecast.update({
      where: { id: validated.id },
      data: {
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
        ...(validated.isDefault !== undefined ? { isDefault: validated.isDefault } : {}),
        ...(validated.numberOfTrips !== undefined ? { numberOfTrips: validated.numberOfTrips } : {}),
        ...(validated.dtrRate !== undefined ? { dtrRate: validated.dtrRate } : {}),
        ...(validated.avgAccessorialPerTrip !== undefined ? { avgAccessorialPerTrip: validated.avgAccessorialPerTrip } : {}),
        revenuePerTrip: results.revenuePerTrip,
        weeklyRevenue: results.weeklyRevenue,
        monthlyRevenue: results.monthlyRevenue,
        annualRevenue: results.annualRevenue,
      },
    });

    return { success: true, data: serializeForecast(forecast) };
  } catch (error) {
    console.error("Failed to update forecast:", error);
    return { success: false, error: "Failed to update forecast" };
  }
}

// ============================================
// DELETE FORECAST
// ============================================

export async function deleteForecast(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth();

    const forecast = await prisma.forecast.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!forecast) {
      return { success: false, error: "Forecast not found" };
    }

    await prisma.forecast.delete({ where: { id } });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete forecast:", error);
    return { success: false, error: "Failed to delete forecast" };
  }
}
