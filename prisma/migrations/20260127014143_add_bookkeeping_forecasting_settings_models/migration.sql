/*
  Warnings:

  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'PROVIDER');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('REVENUE', 'CONTRA_REVENUE', 'COGS', 'OPERATING_EXPENSE', 'EQUITY', 'UNCATEGORIZED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'REVIEWED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('TOUR_COMPLETED', 'LOAD_COMPLETED', 'ADJUSTMENT_DISPUTE', 'ADJUSTMENT_OTHER');

-- CreateEnum
CREATE TYPE "TripStage" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ForecastStatus" AS ENUM ('PROJECTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "importBatchId" TEXT,
    "details" TEXT NOT NULL,
    "postingDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(12,2),
    "checkOrSlipNum" TEXT,
    "aiCategorized" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "amazonInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_rule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "matchType" TEXT NOT NULL DEFAULT 'contains',
    "field" TEXT NOT NULL DEFAULT 'description',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amazon_invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "routeDomicile" TEXT,
    "equipment" TEXT,
    "programType" TEXT,
    "totalTourPay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAccessorials" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAdjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amazon_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amazon_invoice_line_item" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "loadId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "operator" TEXT,
    "distanceMiles" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "durationHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "itemType" "InvoiceItemType" NOT NULL,
    "baseRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuelSurcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "detention" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tonu" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grossPay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amazon_invoice_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekId" TEXT,
    "tripId" TEXT NOT NULL,
    "tripStage" "TripStage" NOT NULL DEFAULT 'UPCOMING',
    "equipmentType" TEXT,
    "operatorType" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "projectedLoads" INTEGER NOT NULL DEFAULT 0,
    "actualLoads" INTEGER,
    "estimatedAccessorial" DECIMAL(10,2),
    "projectedRevenue" DECIMAL(10,2),
    "actualRevenue" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_load" (
    "id" TEXT NOT NULL,
    "tripDbId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "facilitySequence" TEXT,
    "loadExecutionStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "truckFilter" TEXT,
    "isBobtail" BOOLEAN NOT NULL DEFAULT false,
    "estimateDistance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(10,2),
    "shipperAccount" TEXT,
    "stop1" TEXT,
    "stop1PlannedArr" TIMESTAMP(3),
    "stop2" TEXT,
    "stop2PlannedArr" TIMESTAMP(3),
    "stop3" TEXT,
    "stop3PlannedArr" TIMESTAMP(3),
    "stop4" TEXT,
    "stop4PlannedArr" TIMESTAMP(3),
    "stop5" TEXT,
    "stop5PlannedArr" TIMESTAMP(3),
    "stop6" TEXT,
    "stop6PlannedArr" TIMESTAMP(3),
    "stop7" TEXT,
    "stop7PlannedArr" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_week" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "truckCount" INTEGER NOT NULL DEFAULT 2,
    "nightsCount" INTEGER NOT NULL DEFAULT 7,
    "projectedTours" INTEGER NOT NULL DEFAULT 0,
    "projectedLoads" INTEGER NOT NULL DEFAULT 0,
    "projectedTourPay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "projectedAccessorials" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "projectedTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "actualTours" INTEGER,
    "actualLoads" INTEGER,
    "actualTourPay" DECIMAL(12,2),
    "actualAccessorials" DECIMAL(12,2),
    "actualAdjustments" DECIMAL(12,2),
    "actualTotal" DECIMAL(12,2),
    "variance" DECIMAL(12,2),
    "variancePercent" DOUBLE PRECISION,
    "amazonInvoiceId" TEXT,
    "notes" TEXT,
    "status" "ForecastStatus" NOT NULL DEFAULT 'PROJECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "truckCount" INTEGER NOT NULL,
    "nightsPerWeek" INTEGER NOT NULL DEFAULT 7,
    "toursPerTruck" INTEGER NOT NULL DEFAULT 1,
    "avgLoadsPerTour" DECIMAL(4,2) NOT NULL DEFAULT 4,
    "dtrRate" DECIMAL(10,2) NOT NULL DEFAULT 452,
    "avgAccessorialRate" DECIMAL(10,2) NOT NULL DEFAULT 77,
    "hourlyWage" DECIMAL(10,2) NOT NULL DEFAULT 20,
    "hoursPerNight" DECIMAL(4,2) NOT NULL DEFAULT 10,
    "overtimeMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.5,
    "payrollTaxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.0765,
    "workersCompRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "weeklyRevenue" DECIMAL(12,2) NOT NULL,
    "weeklyLaborCost" DECIMAL(12,2) NOT NULL,
    "weeklyOverhead" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "weeklyProfit" DECIMAL(12,2) NOT NULL,
    "contributionMargin" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE INDEX "transaction_userId_postingDate_idx" ON "transaction"("userId", "postingDate");

-- CreateIndex
CREATE INDEX "transaction_categoryId_idx" ON "transaction"("categoryId");

-- CreateIndex
CREATE INDEX "transaction_importBatchId_idx" ON "transaction"("importBatchId");

-- CreateIndex
CREATE INDEX "category_rule_userId_isActive_idx" ON "category_rule"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "amazon_invoice_invoiceNumber_key" ON "amazon_invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "amazon_invoice_userId_paymentDate_idx" ON "amazon_invoice"("userId", "paymentDate");

-- CreateIndex
CREATE INDEX "amazon_invoice_line_item_invoiceId_idx" ON "amazon_invoice_line_item"("invoiceId");

-- CreateIndex
CREATE INDEX "amazon_invoice_line_item_tripId_idx" ON "amazon_invoice_line_item"("tripId");

-- CreateIndex
CREATE INDEX "trip_userId_scheduledDate_idx" ON "trip"("userId", "scheduledDate");

-- CreateIndex
CREATE INDEX "trip_weekId_idx" ON "trip"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_userId_tripId_key" ON "trip"("userId", "tripId");

-- CreateIndex
CREATE INDEX "trip_load_tripDbId_idx" ON "trip_load"("tripDbId");

-- CreateIndex
CREATE INDEX "trip_load_loadId_idx" ON "trip_load"("loadId");

-- CreateIndex
CREATE INDEX "forecast_week_userId_year_weekNumber_idx" ON "forecast_week"("userId", "year", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_week_userId_weekStart_key" ON "forecast_week"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "forecast_userId_idx" ON "forecast"("userId");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_amazonInvoiceId_fkey" FOREIGN KEY ("amazonInvoiceId") REFERENCES "amazon_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_rule" ADD CONSTRAINT "category_rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_rule" ADD CONSTRAINT "category_rule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amazon_invoice" ADD CONSTRAINT "amazon_invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amazon_invoice_line_item" ADD CONSTRAINT "amazon_invoice_line_item_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "amazon_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "forecast_week"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_load" ADD CONSTRAINT "trip_load_tripDbId_fkey" FOREIGN KEY ("tripDbId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_week" ADD CONSTRAINT "forecast_week_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast" ADD CONSTRAINT "forecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
