import { z } from "zod";

// ============================================
// TRANSACTION SCHEMAS
// ============================================

export const reviewStatusEnum = z.enum(["PENDING", "REVIEWED", "FLAGGED"]);

export const transactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  importBatchId: z.string().uuid().nullable(),

  // Bank data fields
  details: z.string().min(1, "Details is required"), // DEBIT, CREDIT, CHECK, DSLIP
  postingDate: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number(), // Positive for credits, negative for debits
  type: z.string().min(1, "Type is required"), // ACH_DEBIT, ACH_CREDIT, DEBIT_CARD, etc.
  balance: z.coerce.number().nullable().optional(),
  checkOrSlipNum: z.string().nullable().optional(),

  // Categorization
  aiCategorized: z.boolean().default(false),
  aiConfidence: z.coerce.number().min(0).max(1).nullable().optional(),
  manualOverride: z.boolean().default(false),
  reviewStatus: reviewStatusEnum.default("PENDING"),

  // Matching
  amazonInvoiceId: z.string().uuid().nullable().optional(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createTransactionSchema = z.object({
  details: z.string().min(1, "Details is required"),
  postingDate: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number(),
  type: z.string().min(1, "Type is required"),
  balance: z.coerce.number().nullable().optional(),
  checkOrSlipNum: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  reviewStatus: reviewStatusEnum.optional(),
  manualOverride: z.boolean().optional(),
});

export const bulkUpdateCategorySchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1, "Select at least one transaction"),
  categoryId: z.string().uuid("Please select a category"),
  createRule: z.boolean().default(false),
  rulePattern: z.string().optional(),
});

// ============================================
// IMPORT SCHEMAS
// ============================================

// Schema for a single row from bank CSV
export const importTransactionRowSchema = z.object({
  details: z.string().min(1),
  postingDate: z.coerce.date(),
  description: z.string().min(1),
  amount: z.coerce.number(),
  type: z.string().min(1),
  balance: z.coerce.number().nullable().optional(),
  checkOrSlipNum: z.string().nullable().optional(),
});

// Schema for import preview with AI categorization
export const importPreviewItemSchema = z.object({
  rowIndex: z.number(),
  transaction: importTransactionRowSchema,
  suggestedCategoryId: z.string().uuid().nullable(),
  suggestedCategoryName: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  isDuplicate: z.boolean(),
  duplicateId: z.string().uuid().nullable().optional(),
  matchedRule: z.string().nullable().optional(), // Rule pattern that matched
});

export const importBatchSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(["CSV", "XLSX"]),
  transactions: z.array(importTransactionRowSchema),
});

// ============================================
// FILTER SCHEMAS
// ============================================

export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  type: z.string().optional(), // ACH_DEBIT, ACH_CREDIT, etc.
  details: z.string().optional(), // DEBIT, CREDIT, CHECK, DSLIP
  reviewStatus: reviewStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  uncategorizedOnly: z.boolean().optional(),
  aiCategorizedOnly: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(["postingDate", "amount", "description", "createdAt"]).default("postingDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================
// P&L SCHEMAS
// ============================================

export const plPeriodSchema = z.object({
  type: z.enum(["week", "month", "quarter", "year", "custom"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const plLineItemSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  categoryColor: z.string(),
  categoryType: z.enum(["REVENUE", "EXPENSE", "TRANSFER", "UNKNOWN"]),
  amount: z.number(),
  transactionCount: z.number(),
  percentage: z.number(), // Percentage of total revenue or expenses
});

export const plStatementSchema = z.object({
  period: plPeriodSchema,
  revenue: z.object({
    items: z.array(plLineItemSchema),
    total: z.number(),
  }),
  expenses: z.object({
    items: z.array(plLineItemSchema),
    total: z.number(),
  }),
  netProfit: z.number(),
  uncategorizedCount: z.number(),
  uncategorizedAmount: z.number(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Transaction = z.infer<typeof transactionSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type BulkUpdateCategoryInput = z.infer<typeof bulkUpdateCategorySchema>;
export type ImportTransactionRow = z.infer<typeof importTransactionRowSchema>;
export type ImportPreviewItem = z.infer<typeof importPreviewItemSchema>;
export type ImportBatchInput = z.infer<typeof importBatchSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
export type PLPeriod = z.infer<typeof plPeriodSchema>;
export type PLLineItem = z.infer<typeof plLineItemSchema>;
export type PLStatement = z.infer<typeof plStatementSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusEnum>;
