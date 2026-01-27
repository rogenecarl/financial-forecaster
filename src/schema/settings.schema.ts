import { z } from "zod";

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const categoryTypeEnum = z.enum(["REVENUE", "EXPENSE", "TRANSFER", "UNKNOWN"]);

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  type: categoryTypeEnum,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  includeInPL: z.boolean(),
  isSystem: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  type: categoryTypeEnum,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  includeInPL: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export type CategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

// ============================================
// CATEGORY RULE SCHEMAS
// ============================================

export const matchTypeEnum = z.enum(["contains", "startsWith", "endsWith", "regex"]);
export const fieldTypeEnum = z.enum(["description", "type", "details"]);

export const categoryRuleSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Please select a category"),
  pattern: z.string().min(1, "Pattern is required").max(200, "Pattern must be 200 characters or less"),
  matchType: matchTypeEnum,
  field: fieldTypeEnum,
  priority: z.number().int().min(0).max(100),
  isActive: z.boolean(),
});

export const createCategoryRuleSchema = z.object({
  categoryId: z.string().uuid("Please select a category"),
  pattern: z.string().min(1, "Pattern is required").max(200, "Pattern must be 200 characters or less"),
  matchType: matchTypeEnum,
  field: fieldTypeEnum,
  priority: z.number().int().min(0).max(100),
  isActive: z.boolean(),
});

export const updateCategoryRuleSchema = createCategoryRuleSchema.partial().extend({
  id: z.string().uuid(),
});

export type CategoryRuleFormData = z.infer<typeof createCategoryRuleSchema>;
export type UpdateCategoryRuleFormData = z.infer<typeof updateCategoryRuleSchema>;

// ============================================
// USER SETTINGS SCHEMAS
// ============================================

export const userSettingsSchema = z.object({
  // Display preferences
  dateFormat: z.string().default("MM/dd/yyyy"),
  currencyFormat: z.string().default("USD"),
  timezone: z.string().default("America/Chicago"),

  // Default values for forecasting
  defaultDtrRate: z.coerce.number().min(0).max(10000).default(452),
  defaultAccessorialRate: z.coerce.number().min(0).max(1000).default(77),
  defaultHourlyWage: z.coerce.number().min(0).max(500).default(20),
  defaultHoursPerNight: z.coerce.number().min(0).max(24).default(10),
  defaultTruckCount: z.coerce.number().int().min(1).max(100).default(2),

  // Excluded addresses for load counting
  excludedAddresses: z.array(z.string()).default(["MSP7", "MSP8", "MSP9"]),

  // AI settings
  aiCategorizationEnabled: z.boolean().default(true),
  aiConfidenceThreshold: z.coerce.number().min(0).max(1).default(0.8),
});

export const updateUserSettingsSchema = userSettingsSchema.partial();

export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettingsFormData = z.infer<typeof updateUserSettingsSchema>;

// ============================================
// EXCLUDED ADDRESS SCHEMA
// ============================================

export const excludedAddressSchema = z.object({
  address: z.string().min(1, "Address is required").max(20, "Address must be 20 characters or less"),
});

export type ExcludedAddressFormData = z.infer<typeof excludedAddressSchema>;
