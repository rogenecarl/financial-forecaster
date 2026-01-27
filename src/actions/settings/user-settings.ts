"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { updateUserSettingsSchema } from "@/schema/settings.schema";
import type { ActionResponse } from "@/types/api";
import type { UserSettings } from "@/lib/generated/prisma/client";

// Serializable version of UserSettings (Decimal converted to number)
export type SerializedUserSettings = Omit<
  UserSettings,
  "defaultDtrRate" | "defaultAccessorialRate" | "defaultHourlyWage" | "defaultHoursPerNight"
> & {
  defaultDtrRate: number;
  defaultAccessorialRate: number;
  defaultHourlyWage: number;
  defaultHoursPerNight: number;
};

// Helper to serialize UserSettings (convert Decimal to number)
function serializeUserSettings(settings: UserSettings): SerializedUserSettings {
  return {
    ...settings,
    defaultDtrRate: Number(settings.defaultDtrRate),
    defaultAccessorialRate: Number(settings.defaultAccessorialRate),
    defaultHourlyWage: Number(settings.defaultHourlyWage),
    defaultHoursPerNight: Number(settings.defaultHoursPerNight),
  };
}

export async function getUserSettings(): Promise<ActionResponse<SerializedUserSettings>> {
  try {
    const session = await requireAuth();

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return { success: true, data: serializeUserSettings(settings) };
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return { success: false, error: "Failed to fetch user settings" };
  }
}

export async function updateUserSettings(
  data: unknown
): Promise<ActionResponse<SerializedUserSettings>> {
  try {
    const session = await requireAuth();

    const validatedData = updateUserSettingsSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid data",
      };
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: validatedData.data,
      create: {
        userId: session.user.id,
        ...validatedData.data,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serializeUserSettings(settings) };
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return { success: false, error: "Failed to update user settings" };
  }
}

// Specifically for updating excluded addresses
export async function addExcludedAddress(
  address: string
): Promise<ActionResponse<SerializedUserSettings>> {
  try {
    const session = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    const currentAddresses = settings?.excludedAddresses || [];

    // Check if already exists (case-insensitive)
    if (currentAddresses.some((a) => a.toLowerCase() === address.toLowerCase())) {
      return { success: false, error: "Address already exists" };
    }

    const updated = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        excludedAddresses: [...currentAddresses, address.toUpperCase()],
      },
      create: {
        userId: session.user.id,
        excludedAddresses: [address.toUpperCase()],
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serializeUserSettings(updated) };
  } catch (error) {
    console.error("Failed to add excluded address:", error);
    return { success: false, error: "Failed to add excluded address" };
  }
}

export async function removeExcludedAddress(
  address: string
): Promise<ActionResponse<SerializedUserSettings>> {
  try {
    const session = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      return { success: false, error: "Settings not found" };
    }

    const updated = await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: {
        excludedAddresses: settings.excludedAddresses.filter(
          (a) => a.toLowerCase() !== address.toLowerCase()
        ),
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serializeUserSettings(updated) };
  } catch (error) {
    console.error("Failed to remove excluded address:", error);
    return { success: false, error: "Failed to remove excluded address" };
  }
}

// Update AI settings specifically
export async function updateAISettings(
  enabled: boolean,
  threshold: number
): Promise<ActionResponse<SerializedUserSettings>> {
  try {
    const session = await requireAuth();

    if (threshold < 0 || threshold > 1) {
      return { success: false, error: "Threshold must be between 0 and 1" };
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        aiCategorizationEnabled: enabled,
        aiConfidenceThreshold: threshold,
      },
      create: {
        userId: session.user.id,
        aiCategorizationEnabled: enabled,
        aiConfidenceThreshold: threshold,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serializeUserSettings(settings) };
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return { success: false, error: "Failed to update AI settings" };
  }
}

// Update forecasting defaults
export async function updateForecastingDefaults(data: {
  defaultDtrRate?: number;
  defaultAccessorialRate?: number;
  defaultHourlyWage?: number;
  defaultHoursPerNight?: number;
  defaultTruckCount?: number;
}): Promise<ActionResponse<SerializedUserSettings>> {
  try {
    const session = await requireAuth();

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    });

    revalidatePath("/settings");
    return { success: true, data: serializeUserSettings(settings) };
  } catch (error) {
    console.error("Failed to update forecasting defaults:", error);
    return { success: false, error: "Failed to update forecasting defaults" };
  }
}
