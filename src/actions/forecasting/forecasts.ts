"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import type {
  Forecast,
  CreateForecast,
  UpdateForecast,
  ForecastInput,
} from "@/schema/forecasting.schema";
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

    const result: Forecast[] = forecasts.map((f) => ({
      id: f.id,
      userId: f.userId,
      name: f.name,
      description: f.description,
      isDefault: f.isDefault,
      truckCount: f.truckCount,
      nightsPerWeek: f.nightsPerWeek,
      toursPerTruck: f.toursPerTruck,
      avgLoadsPerTour: toNumber(f.avgLoadsPerTour),
      dtrRate: toNumber(f.dtrRate),
      avgAccessorialRate: toNumber(f.avgAccessorialRate),
      hourlyWage: toNumber(f.hourlyWage),
      hoursPerNight: toNumber(f.hoursPerNight),
      overtimeMultiplier: toNumber(f.overtimeMultiplier),
      payrollTaxRate: toNumber(f.payrollTaxRate),
      workersCompRate: toNumber(f.workersCompRate),
      weeklyRevenue: toNumber(f.weeklyRevenue),
      weeklyLaborCost: toNumber(f.weeklyLaborCost),
      weeklyOverhead: toNumber(f.weeklyOverhead),
      weeklyProfit: toNumber(f.weeklyProfit),
      contributionMargin: toNumber(f.contributionMargin),
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    return { success: true, data: result };
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

    const result: Forecast = {
      id: forecast.id,
      userId: forecast.userId,
      name: forecast.name,
      description: forecast.description,
      isDefault: forecast.isDefault,
      truckCount: forecast.truckCount,
      nightsPerWeek: forecast.nightsPerWeek,
      toursPerTruck: forecast.toursPerTruck,
      avgLoadsPerTour: toNumber(forecast.avgLoadsPerTour),
      dtrRate: toNumber(forecast.dtrRate),
      avgAccessorialRate: toNumber(forecast.avgAccessorialRate),
      hourlyWage: toNumber(forecast.hourlyWage),
      hoursPerNight: toNumber(forecast.hoursPerNight),
      overtimeMultiplier: toNumber(forecast.overtimeMultiplier),
      payrollTaxRate: toNumber(forecast.payrollTaxRate),
      workersCompRate: toNumber(forecast.workersCompRate),
      weeklyRevenue: toNumber(forecast.weeklyRevenue),
      weeklyLaborCost: toNumber(forecast.weeklyLaborCost),
      weeklyOverhead: toNumber(forecast.weeklyOverhead),
      weeklyProfit: toNumber(forecast.weeklyProfit),
      contributionMargin: toNumber(forecast.contributionMargin),
      createdAt: forecast.createdAt,
      updatedAt: forecast.updatedAt,
    };

    return { success: true, data: result };
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
    const results = calculateForecast({
      ...validated,
      includeOvertime: false,
    });

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
        truckCount: validated.truckCount,
        nightsPerWeek: validated.nightsPerWeek,
        toursPerTruck: validated.toursPerTruck,
        avgLoadsPerTour: validated.avgLoadsPerTour,
        dtrRate: validated.dtrRate,
        avgAccessorialRate: validated.avgAccessorialRate,
        hourlyWage: validated.hourlyWage,
        hoursPerNight: validated.hoursPerNight,
        overtimeMultiplier: validated.overtimeMultiplier,
        payrollTaxRate: validated.payrollTaxRate,
        workersCompRate: validated.workersCompRate,
        weeklyRevenue: results.weeklyRevenue,
        weeklyLaborCost: results.laborCost + results.payrollTax + results.workersComp,
        weeklyOverhead: validated.weeklyOverhead,
        weeklyProfit: results.weeklyProfit,
        contributionMargin: results.contributionMargin,
      },
    });

    const result: Forecast = {
      id: forecast.id,
      userId: forecast.userId,
      name: forecast.name,
      description: forecast.description,
      isDefault: forecast.isDefault,
      truckCount: forecast.truckCount,
      nightsPerWeek: forecast.nightsPerWeek,
      toursPerTruck: forecast.toursPerTruck,
      avgLoadsPerTour: toNumber(forecast.avgLoadsPerTour),
      dtrRate: toNumber(forecast.dtrRate),
      avgAccessorialRate: toNumber(forecast.avgAccessorialRate),
      hourlyWage: toNumber(forecast.hourlyWage),
      hoursPerNight: toNumber(forecast.hoursPerNight),
      overtimeMultiplier: toNumber(forecast.overtimeMultiplier),
      payrollTaxRate: toNumber(forecast.payrollTaxRate),
      workersCompRate: toNumber(forecast.workersCompRate),
      weeklyRevenue: toNumber(forecast.weeklyRevenue),
      weeklyLaborCost: toNumber(forecast.weeklyLaborCost),
      weeklyOverhead: toNumber(forecast.weeklyOverhead),
      weeklyProfit: toNumber(forecast.weeklyProfit),
      contributionMargin: toNumber(forecast.contributionMargin),
      createdAt: forecast.createdAt,
      updatedAt: forecast.updatedAt,
    };

    return { success: true, data: result };
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

    // Calculate new results if parameters changed
    const input: ForecastInput = {
      truckCount: validated.truckCount ?? existing.truckCount,
      nightsPerWeek: validated.nightsPerWeek ?? existing.nightsPerWeek,
      toursPerTruck: validated.toursPerTruck ?? existing.toursPerTruck,
      avgLoadsPerTour: validated.avgLoadsPerTour ?? toNumber(existing.avgLoadsPerTour),
      dtrRate: validated.dtrRate ?? toNumber(existing.dtrRate),
      avgAccessorialRate: validated.avgAccessorialRate ?? toNumber(existing.avgAccessorialRate),
      hourlyWage: validated.hourlyWage ?? toNumber(existing.hourlyWage),
      hoursPerNight: validated.hoursPerNight ?? toNumber(existing.hoursPerNight),
      includeOvertime: false,
      overtimeMultiplier: validated.overtimeMultiplier ?? toNumber(existing.overtimeMultiplier),
      payrollTaxRate: validated.payrollTaxRate ?? toNumber(existing.payrollTaxRate),
      workersCompRate: validated.workersCompRate ?? toNumber(existing.workersCompRate),
      weeklyOverhead: validated.weeklyOverhead ?? toNumber(existing.weeklyOverhead),
    };

    const results = calculateForecast(input);

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
        ...(validated.truckCount !== undefined ? { truckCount: validated.truckCount } : {}),
        ...(validated.nightsPerWeek !== undefined ? { nightsPerWeek: validated.nightsPerWeek } : {}),
        ...(validated.toursPerTruck !== undefined ? { toursPerTruck: validated.toursPerTruck } : {}),
        ...(validated.avgLoadsPerTour !== undefined ? { avgLoadsPerTour: validated.avgLoadsPerTour } : {}),
        ...(validated.dtrRate !== undefined ? { dtrRate: validated.dtrRate } : {}),
        ...(validated.avgAccessorialRate !== undefined ? { avgAccessorialRate: validated.avgAccessorialRate } : {}),
        ...(validated.hourlyWage !== undefined ? { hourlyWage: validated.hourlyWage } : {}),
        ...(validated.hoursPerNight !== undefined ? { hoursPerNight: validated.hoursPerNight } : {}),
        ...(validated.overtimeMultiplier !== undefined ? { overtimeMultiplier: validated.overtimeMultiplier } : {}),
        ...(validated.payrollTaxRate !== undefined ? { payrollTaxRate: validated.payrollTaxRate } : {}),
        ...(validated.workersCompRate !== undefined ? { workersCompRate: validated.workersCompRate } : {}),
        ...(validated.weeklyOverhead !== undefined ? { weeklyOverhead: validated.weeklyOverhead } : {}),
        weeklyRevenue: results.weeklyRevenue,
        weeklyLaborCost: results.laborCost + results.payrollTax + results.workersComp,
        weeklyProfit: results.weeklyProfit,
        contributionMargin: results.contributionMargin,
      },
    });

    const result: Forecast = {
      id: forecast.id,
      userId: forecast.userId,
      name: forecast.name,
      description: forecast.description,
      isDefault: forecast.isDefault,
      truckCount: forecast.truckCount,
      nightsPerWeek: forecast.nightsPerWeek,
      toursPerTruck: forecast.toursPerTruck,
      avgLoadsPerTour: toNumber(forecast.avgLoadsPerTour),
      dtrRate: toNumber(forecast.dtrRate),
      avgAccessorialRate: toNumber(forecast.avgAccessorialRate),
      hourlyWage: toNumber(forecast.hourlyWage),
      hoursPerNight: toNumber(forecast.hoursPerNight),
      overtimeMultiplier: toNumber(forecast.overtimeMultiplier),
      payrollTaxRate: toNumber(forecast.payrollTaxRate),
      workersCompRate: toNumber(forecast.workersCompRate),
      weeklyRevenue: toNumber(forecast.weeklyRevenue),
      weeklyLaborCost: toNumber(forecast.weeklyLaborCost),
      weeklyOverhead: toNumber(forecast.weeklyOverhead),
      weeklyProfit: toNumber(forecast.weeklyProfit),
      contributionMargin: toNumber(forecast.contributionMargin),
      createdAt: forecast.createdAt,
      updatedAt: forecast.updatedAt,
    };

    return { success: true, data: result };
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

