"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import { startOfWeek, endOfWeek } from "date-fns";
import { getWeekId } from "@/lib/week-utils";
import type { BatchStatus } from "@/lib/generated/prisma/client";

// ============================================
// TYPES
// ============================================

export interface TripBatchOption {
  id: string;
  name: string;
  description: string | null;
  status: BatchStatus;
  tripCount: number;
  loadCount: number;
  projectedTotal: number;
  actualTotal: number | null;
  createdAt: Date;
}

export interface TripStatusCount {
  status: string;
  count: number;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toNumber === "function") return value.toNumber();
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// ============================================
// GET TRIP BATCH OPTIONS
// ============================================

export async function getTripBatchOptions(): Promise<ActionResponse<TripBatchOption[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const batches = await prisma.tripBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        tripCount: true,
        loadCount: true,
        projectedTotal: true,
        actualTotal: true,
        createdAt: true,
      },
    });

    const options: TripBatchOption[] = batches.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      status: b.status,
      tripCount: b.tripCount,
      loadCount: b.loadCount,
      projectedTotal: toNumber(b.projectedTotal),
      actualTotal: toNumberOrNull(b.actualTotal),
      createdAt: b.createdAt,
    }));

    return { success: true, data: options };
  } catch (error) {
    console.error("Failed to get trip batch options:", error);
    return { success: false, error: "Failed to load batches" };
  }
}

// ============================================
// GET TRIP STATUS COUNTS
// ============================================

export async function getTripStatusCounts(
  batchId?: string
): Promise<ActionResponse<TripStatusCount[]>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Build where clause
    const where: {
      userId: string;
      batchId?: string;
    } = { userId };

    if (batchId) {
      where.batchId = batchId;
    }

    // Get counts grouped by status
    const statusCounts = await prisma.trip.groupBy({
      by: ["tripStage"],
      where,
      _count: { id: true },
    });

    const counts: TripStatusCount[] = statusCounts.map((sc) => ({
      status: sc.tripStage,
      count: sc._count.id,
    }));

    return { success: true, data: counts };
  } catch (error) {
    console.error("Failed to get trip status counts:", error);
    return { success: false, error: "Failed to load status counts" };
  }
}

// ============================================
// GET CURRENT WEEK INFO
// ============================================

export async function getCurrentWeekInfo(): Promise<
  ActionResponse<{
    currentWeekId: string;
    currentWeekStart: Date;
    currentWeekEnd: Date;
  }>
> {
  try {
    await requireAuth();

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekId = getWeekId(weekStart);

    return {
      success: true,
      data: {
        currentWeekId: weekId,
        currentWeekStart: weekStart,
        currentWeekEnd: weekEnd,
      },
    };
  } catch (error) {
    console.error("Failed to get current week info:", error);
    return { success: false, error: "Failed to get current week" };
  }
}
