import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const invoiceItemTypeEnum = z.enum([
  "TOUR_COMPLETED",
  "LOAD_COMPLETED",
  "ADJUSTMENT_DISPUTE",
  "ADJUSTMENT_OTHER",
]);

export const tripStageEnum = z.enum([
  "UPCOMING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
]);

export const batchStatusEnum = z.enum([
  "EMPTY",
  "UPCOMING",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
]);

// ============================================
// AMAZON INVOICE SCHEMAS
// ============================================

export const amazonInvoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  tripId: z.string(),
  loadId: z.string().nullable(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  operator: z.string().nullable(),
  distanceMiles: z.coerce.number().default(0),
  durationHours: z.coerce.number().default(0),
  itemType: invoiceItemTypeEnum,
  baseRate: z.coerce.number().default(0),
  fuelSurcharge: z.coerce.number().default(0),
  detention: z.coerce.number().default(0),
  tonu: z.coerce.number().default(0),
  grossPay: z.coerce.number().default(0),
  comments: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const amazonInvoiceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  batchId: z.string().nullable(),
  invoiceNumber: z.string(),
  routeDomicile: z.string().nullable(),
  equipment: z.string().nullable(),
  programType: z.string().nullable(),
  totalTourPay: z.coerce.number().default(0),
  totalAccessorials: z.coerce.number().default(0),
  totalAdjustments: z.coerce.number().default(0),
  totalPay: z.coerce.number().default(0),
  periodStart: z.coerce.date().nullable(),
  periodEnd: z.coerce.date().nullable(),
  paymentDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lineItems: z.array(amazonInvoiceLineItemSchema).optional(),
});

export const createInvoiceLineItemSchema = z.object({
  tripId: z.string(),
  loadId: z.string().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  operator: z.string().nullable().optional(),
  distanceMiles: z.coerce.number().default(0),
  durationHours: z.coerce.number().default(0),
  itemType: invoiceItemTypeEnum,
  baseRate: z.coerce.number().default(0),
  fuelSurcharge: z.coerce.number().default(0),
  detention: z.coerce.number().default(0),
  tonu: z.coerce.number().default(0),
  grossPay: z.coerce.number().default(0),
  comments: z.string().nullable().optional(),
});

export const importInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  routeDomicile: z.string().nullable().optional(),
  equipment: z.string().nullable().optional(),
  programType: z.string().nullable().optional(),
  periodStart: z.coerce.date().nullable().optional(),
  periodEnd: z.coerce.date().nullable().optional(),
  paymentDate: z.coerce.date().nullable().optional(),
  lineItems: z.array(createInvoiceLineItemSchema),
});

// ============================================
// TRIP SCHEMAS
// ============================================

export const tripLoadSchema = z.object({
  id: z.string().uuid(),
  tripDbId: z.string().uuid(),
  loadId: z.string(),
  facilitySequence: z.string().nullable(),
  loadExecutionStatus: z.string().default("Not Started"),
  truckFilter: z.string().nullable(),
  isBobtail: z.boolean().default(false),
  estimateDistance: z.coerce.number().default(0),
  estimatedCost: z.coerce.number().nullable(),
  shipperAccount: z.string().nullable(),
  stop1: z.string().nullable(),
  stop1PlannedArr: z.coerce.date().nullable(),
  stop2: z.string().nullable(),
  stop2PlannedArr: z.coerce.date().nullable(),
  stop3: z.string().nullable(),
  stop3PlannedArr: z.coerce.date().nullable(),
  stop4: z.string().nullable(),
  stop4PlannedArr: z.coerce.date().nullable(),
  stop5: z.string().nullable(),
  stop5PlannedArr: z.coerce.date().nullable(),
  stop6: z.string().nullable(),
  stop6PlannedArr: z.coerce.date().nullable(),
  stop7: z.string().nullable(),
  stop7PlannedArr: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const tripSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  batchId: z.string().nullable(),
  tripId: z.string(),
  tripStage: tripStageEnum.default("UPCOMING"),
  equipmentType: z.string().nullable(),
  operatorType: z.string().nullable(),
  scheduledDate: z.coerce.date(),
  projectedLoads: z.number().int().default(0),
  actualLoads: z.number().int().nullable(),
  estimatedAccessorial: z.coerce.number().nullable(),
  projectedRevenue: z.coerce.number().nullable(),
  actualRevenue: z.coerce.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  loads: z.array(tripLoadSchema).optional(),
});

export const createTripLoadSchema = z.object({
  loadId: z.string(),
  facilitySequence: z.string().nullable().optional(),
  loadExecutionStatus: z.string().default("Not Started"),
  truckFilter: z.string().nullable().optional(),
  isBobtail: z.boolean().default(false),
  estimateDistance: z.coerce.number().default(0),
  estimatedCost: z.coerce.number().nullable().optional(),
  shipperAccount: z.string().nullable().optional(),
  stop1: z.string().nullable().optional(),
  stop1PlannedArr: z.coerce.date().nullable().optional(),
  stop2: z.string().nullable().optional(),
  stop2PlannedArr: z.coerce.date().nullable().optional(),
  stop3: z.string().nullable().optional(),
  stop3PlannedArr: z.coerce.date().nullable().optional(),
  stop4: z.string().nullable().optional(),
  stop4PlannedArr: z.coerce.date().nullable().optional(),
  stop5: z.string().nullable().optional(),
  stop5PlannedArr: z.coerce.date().nullable().optional(),
  stop6: z.string().nullable().optional(),
  stop6PlannedArr: z.coerce.date().nullable().optional(),
  stop7: z.string().nullable().optional(),
  stop7PlannedArr: z.coerce.date().nullable().optional(),
});

export const importTripSchema = z.object({
  tripId: z.string(),
  tripStage: tripStageEnum.default("UPCOMING"),
  equipmentType: z.string().nullable().optional(),
  operatorType: z.string().nullable().optional(),
  scheduledDate: z.coerce.date(),
  projectedLoads: z.number().int().default(0),
  estimatedAccessorial: z.coerce.number().nullable().optional(),
  projectedRevenue: z.coerce.number().nullable().optional(),
  loads: z.array(createTripLoadSchema),
});

export const updateTripSchema = z.object({
  id: z.string().uuid(),
  actualLoads: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  tripStage: tripStageEnum.optional(),
});

export const tripFilterSchema = z.object({
  weekStart: z.coerce.date().optional(),
  weekEnd: z.coerce.date().optional(),
  tripStage: tripStageEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============================================
// TRIP BATCH SCHEMAS
// ============================================

export const tripBatchSchema = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: batchStatusEnum.default("EMPTY"),
  tripFileHash: z.string().nullable(),
  invoiceFileHash: z.string().nullable(),
  tripsImportedAt: z.coerce.date().nullable(),
  invoiceImportedAt: z.coerce.date().nullable(),
  tripCount: z.number().int().default(0),
  loadCount: z.number().int().default(0),
  canceledCount: z.number().int().default(0),
  completedCount: z.number().int().default(0),
  projectedTours: z.number().int().default(0),
  projectedLoads: z.number().int().default(0),
  projectedTourPay: z.coerce.number().default(0),
  projectedAccessorials: z.coerce.number().default(0),
  projectedTotal: z.coerce.number().default(0),
  actualTours: z.number().int().nullable(),
  actualLoads: z.number().int().nullable(),
  actualTourPay: z.coerce.number().nullable(),
  actualAccessorials: z.coerce.number().nullable(),
  actualAdjustments: z.coerce.number().nullable(),
  actualTotal: z.coerce.number().nullable(),
  variance: z.coerce.number().nullable(),
  variancePercent: z.number().nullable(),
  projectionLockedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createTripBatchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
});

export const updateTripBatchSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

// ============================================
// FORECAST SCENARIO SCHEMAS
// ============================================

export const forecastSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean().default(false),
  truckCount: z.number().int(),
  nightsPerWeek: z.number().int().default(7),
  toursPerTruck: z.number().int().default(1),
  avgLoadsPerTour: z.coerce.number().default(4),
  dtrRate: z.coerce.number().default(452.09),
  avgAccessorialRate: z.coerce.number().default(34.12),
  hourlyWage: z.coerce.number().default(20),
  hoursPerNight: z.coerce.number().default(10),
  overtimeMultiplier: z.coerce.number().default(1.5),
  payrollTaxRate: z.coerce.number().default(0.0765),
  workersCompRate: z.coerce.number().default(0.05),
  weeklyRevenue: z.coerce.number(),
  weeklyLaborCost: z.coerce.number(),
  weeklyOverhead: z.coerce.number().default(0),
  weeklyProfit: z.coerce.number(),
  contributionMargin: z.coerce.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createForecastSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
  truckCount: z.number().int().min(1).default(2),
  nightsPerWeek: z.number().int().min(1).max(7).default(7),
  toursPerTruck: z.number().int().min(1).default(1),
  avgLoadsPerTour: z.coerce.number().min(0).default(4),
  dtrRate: z.coerce.number().min(0).default(452),
  avgAccessorialRate: z.coerce.number().min(0).default(77),
  hourlyWage: z.coerce.number().min(0).default(20),
  hoursPerNight: z.coerce.number().min(0).default(10),
  overtimeMultiplier: z.coerce.number().min(1).default(1.5),
  payrollTaxRate: z.coerce.number().min(0).max(1).default(0.0765),
  workersCompRate: z.coerce.number().min(0).max(1).default(0.05),
  weeklyOverhead: z.coerce.number().min(0).default(0),
});

export const updateForecastSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  truckCount: z.number().int().min(1).optional(),
  nightsPerWeek: z.number().int().min(1).max(7).optional(),
  toursPerTruck: z.number().int().min(1).optional(),
  avgLoadsPerTour: z.coerce.number().min(0).optional(),
  dtrRate: z.coerce.number().min(0).optional(),
  avgAccessorialRate: z.coerce.number().min(0).optional(),
  hourlyWage: z.coerce.number().min(0).optional(),
  hoursPerNight: z.coerce.number().min(0).optional(),
  overtimeMultiplier: z.coerce.number().min(1).optional(),
  payrollTaxRate: z.coerce.number().min(0).max(1).optional(),
  workersCompRate: z.coerce.number().min(0).max(1).optional(),
  weeklyOverhead: z.coerce.number().min(0).optional(),
});

// ============================================
// FORECAST CALCULATION SCHEMAS
// ============================================

export const forecastInputSchema = z.object({
  truckCount: z.number().int().min(1).default(2),
  nightsPerWeek: z.number().int().min(1).max(7).default(7),
  toursPerTruck: z.number().int().min(1).default(1),
  avgLoadsPerTour: z.coerce.number().min(0).default(4),
  dtrRate: z.coerce.number().min(0).default(452),
  avgAccessorialRate: z.coerce.number().min(0).default(77),
  hourlyWage: z.coerce.number().min(0).default(20),
  hoursPerNight: z.coerce.number().min(0).default(10),
  includeOvertime: z.boolean().default(false),
  overtimeMultiplier: z.coerce.number().min(1).default(1.5),
  payrollTaxRate: z.coerce.number().min(0).max(1).default(0.0765),
  workersCompRate: z.coerce.number().min(0).max(1).default(0.05),
  weeklyOverhead: z.coerce.number().min(0).default(0),
});

export const forecastResultSchema = z.object({
  weeklyTours: z.number(),
  weeklyLoads: z.number(),
  tourPay: z.number(),
  accessorialPay: z.number(),
  weeklyRevenue: z.number(),
  laborCost: z.number(),
  payrollTax: z.number(),
  workersComp: z.number(),
  overhead: z.number(),
  weeklyCost: z.number(),
  weeklyProfit: z.number(),
  contributionMargin: z.number(), // Per truck per day
});

// ============================================
// VARIANCE SCHEMAS
// ============================================

export const varianceBreakdownSchema = z.object({
  component: z.string(),
  forecast: z.number(),
  actual: z.number(),
  variance: z.number(),
  variancePercent: z.number().nullable(),
});

export const tripVarianceSchema = z.object({
  tripId: z.string(),
  tripDbId: z.string().uuid(),
  projectedLoads: z.number(),
  actualLoads: z.number().nullable(),
  projectedPay: z.number(),
  actualPay: z.number().nullable(),
  variance: z.number().nullable(),
  status: z.string(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type InvoiceItemType = z.infer<typeof invoiceItemTypeEnum>;
export type TripStage = z.infer<typeof tripStageEnum>;
export type BatchStatus = z.infer<typeof batchStatusEnum>;

export type AmazonInvoiceLineItem = z.infer<typeof amazonInvoiceLineItemSchema>;
export type AmazonInvoice = z.infer<typeof amazonInvoiceSchema>;
export type CreateInvoiceLineItem = z.infer<typeof createInvoiceLineItemSchema>;
export type ImportInvoice = z.infer<typeof importInvoiceSchema>;

export type TripLoad = z.infer<typeof tripLoadSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type CreateTripLoad = z.infer<typeof createTripLoadSchema>;
export type ImportTrip = z.infer<typeof importTripSchema>;
export type UpdateTrip = z.infer<typeof updateTripSchema>;
export type TripFilter = z.infer<typeof tripFilterSchema>;

export type TripBatch = z.infer<typeof tripBatchSchema>;
export type CreateTripBatch = z.infer<typeof createTripBatchSchema>;
export type UpdateTripBatch = z.infer<typeof updateTripBatchSchema>;

export type Forecast = z.infer<typeof forecastSchema>;
export type CreateForecast = z.infer<typeof createForecastSchema>;
export type UpdateForecast = z.infer<typeof updateForecastSchema>;

export type ForecastInput = z.infer<typeof forecastInputSchema>;
export type ForecastResult = z.infer<typeof forecastResultSchema>;

export type VarianceBreakdown = z.infer<typeof varianceBreakdownSchema>;
export type TripVariance = z.infer<typeof tripVarianceSchema>;
