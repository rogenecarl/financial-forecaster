import { z } from "zod";

// ============================================
// CATEGORY SCHEMAS
// ============================================

// Multi-tier P&L category types:
// - REVENUE:           In P&L (positive)
// - CONTRA_REVENUE:    In P&L (reduces revenue)
// - COGS:              In P&L (Cost of Goods Sold - direct costs)
// - OPERATING_EXPENSE: In P&L (indirect costs)
// - EQUITY:            Not in P&L (owner transactions)
// - UNCATEGORIZED:     Not in P&L (needs review)
export const categoryTypeEnum = z.enum([
  "REVENUE",
  "CONTRA_REVENUE",
  "COGS",
  "OPERATING_EXPENSE",
  "EQUITY",
  "UNCATEGORIZED",
]);

// Normalize category name: trim whitespace and collapse multiple spaces
const normalizedCategoryName = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .transform((val) => val.trim().replace(/\s+/g, " "));

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: normalizedCategoryName,
  type: categoryTypeEnum,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  isSystem: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const createCategorySchema = z.object({
  name: normalizedCategoryName,
  type: categoryTypeEnum,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  sortOrder: z.number().int().min(0).default(50),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export type CategoryFormData = z.input<typeof createCategorySchema>;
export type CategoryFormOutput = z.output<typeof createCategorySchema>;
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
