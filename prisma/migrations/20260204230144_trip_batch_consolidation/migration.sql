-- ============================================
-- TRIP BATCH CONSOLIDATION MIGRATION
-- ============================================
-- This migration:
-- 1. Creates the new trip_batch table
-- 2. Migrates data from trip_import_batch to trip_batch
-- 3. Links existing trips and invoices to new batches
-- 4. Removes deprecated tables (trip_import_batch, invoice_import_batch, forecast_week)
-- ============================================

-- Step 1: Create the BatchStatus enum
CREATE TYPE "BatchStatus" AS ENUM ('EMPTY', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'INVOICED');

-- Step 2: Create the new trip_batch table
CREATE TABLE "trip_batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'EMPTY',
    "tripFileHash" TEXT,
    "invoiceFileHash" TEXT,
    "tripsImportedAt" TIMESTAMP(3),
    "invoiceImportedAt" TIMESTAMP(3),
    "tripCount" INTEGER NOT NULL DEFAULT 0,
    "loadCount" INTEGER NOT NULL DEFAULT 0,
    "canceledCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
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
    "projectionLockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_batch_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create indexes on trip_batch
CREATE INDEX "trip_batch_userId_createdAt_idx" ON "trip_batch"("userId", "createdAt");
CREATE INDEX "trip_batch_userId_status_idx" ON "trip_batch"("userId", "status");

-- Step 4: Add foreign key for trip_batch
ALTER TABLE "trip_batch" ADD CONSTRAINT "trip_batch_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Add batchId column to trip and amazon_invoice (keeping old columns for now)
ALTER TABLE "trip" ADD COLUMN "batchId" TEXT;
ALTER TABLE "amazon_invoice" ADD COLUMN "batchId" TEXT;

-- Step 6: Create indexes on the new batchId columns
CREATE INDEX "trip_batchId_idx" ON "trip"("batchId");
CREATE INDEX "amazon_invoice_batchId_idx" ON "amazon_invoice"("batchId");

-- Step 7: Migrate data from trip_import_batch to trip_batch
-- Generate cuid-like IDs and copy relevant data
INSERT INTO "trip_batch" (
    "id",
    "userId",
    "name",
    "description",
    "status",
    "tripFileHash",
    "tripsImportedAt",
    "tripCount",
    "loadCount",
    "canceledCount",
    "completedCount",
    "projectedTours",
    "projectedLoads",
    "projectedTourPay",
    "projectedAccessorials",
    "projectedTotal",
    "createdAt",
    "updatedAt"
)
SELECT
    -- Generate a new ID (using md5 of old id for deterministic migration)
    'migrated_' || "id",
    "userId",
    -- Generate name from period dates
    'Import - ' || TO_CHAR("periodStart", 'Mon DD') || ' to ' || TO_CHAR("periodEnd", 'Mon DD, YYYY'),
    'Auto-migrated from import batch',
    -- Determine status based on existing data
    CASE
        WHEN "canceledCount" = "tripCount" THEN 'COMPLETED'::"BatchStatus"
        WHEN EXISTS (
            SELECT 1 FROM "amazon_invoice" ai
            WHERE ai."importBatchId" IS NOT NULL
            AND ai."periodStart" <= tib."periodEnd"
            AND ai."periodEnd" >= tib."periodStart"
        ) THEN 'INVOICED'::"BatchStatus"
        ELSE 'UPCOMING'::"BatchStatus"
    END,
    "fileHash",
    "importedAt",
    "tripCount",
    "loadCount",
    "canceledCount",
    0, -- completedCount (will recalculate)
    "projectedTours",
    "projectedLoads",
    "projectedTourPay",
    "projectedAccessorials",
    "projectedTotal",
    "importedAt",
    CURRENT_TIMESTAMP
FROM "trip_import_batch" tib
WHERE "status" = 'completed';

-- Step 8: Update trips to link to new trip_batch
UPDATE "trip" t
SET "batchId" = 'migrated_' || t."importBatchId"
WHERE t."importBatchId" IS NOT NULL
AND EXISTS (SELECT 1 FROM "trip_batch" tb WHERE tb."id" = 'migrated_' || t."importBatchId");

-- Step 9: Update completedCount on trip_batch based on actual trip stages
UPDATE "trip_batch" tb
SET "completedCount" = (
    SELECT COUNT(*)
    FROM "trip" t
    WHERE t."batchId" = tb."id"
    AND t."tripStage" = 'COMPLETED'
);

-- Step 10: Link invoices to batches by matching date ranges
-- Find invoices that overlap with batch periods and link them
UPDATE "amazon_invoice" ai
SET "batchId" = tb."id"
FROM "trip_batch" tb
WHERE ai."userId" = tb."userId"
AND ai."batchId" IS NULL
AND ai."periodStart" IS NOT NULL
AND ai."periodEnd" IS NOT NULL
AND (
    -- Invoice period overlaps with batch period (derived from trip dates)
    ai."periodStart" <= (
        SELECT MAX(t."scheduledDate") FROM "trip" t WHERE t."batchId" = tb."id"
    )
    AND ai."periodEnd" >= (
        SELECT MIN(t."scheduledDate") FROM "trip" t WHERE t."batchId" = tb."id"
    )
);

-- Step 11: Update batch status to INVOICED for batches with linked invoices
UPDATE "trip_batch" tb
SET
    "status" = 'INVOICED',
    "invoiceImportedAt" = ai."createdAt",
    "projectionLockedAt" = ai."createdAt"
FROM "amazon_invoice" ai
WHERE ai."batchId" = tb."id";

-- Step 12: Calculate actual metrics from linked invoices
UPDATE "trip_batch" tb
SET
    "actualTours" = sub."tours",
    "actualLoads" = sub."loads",
    "actualTourPay" = sub."tourPay",
    "actualAccessorials" = sub."accessorials",
    "actualAdjustments" = sub."adjustments",
    "actualTotal" = sub."total",
    "variance" = sub."total" - tb."projectedTotal",
    "variancePercent" = CASE
        WHEN tb."projectedTotal" > 0
        THEN ((sub."total" - tb."projectedTotal") / tb."projectedTotal" * 100)::DOUBLE PRECISION
        ELSE NULL
    END
FROM (
    SELECT
        ai."batchId",
        COUNT(DISTINCT li."tripId") as "tours",
        COUNT(CASE WHEN li."itemType" = 'LOAD_COMPLETED' THEN 1 END) as "loads",
        COALESCE(SUM(CASE WHEN li."itemType" = 'TOUR_COMPLETED' THEN li."grossPay" ELSE 0 END), 0) as "tourPay",
        COALESCE(SUM(CASE WHEN li."itemType" = 'LOAD_COMPLETED' THEN li."grossPay" ELSE 0 END), 0) as "accessorials",
        COALESCE(SUM(CASE WHEN li."itemType" IN ('ADJUSTMENT_DISPUTE', 'ADJUSTMENT_OTHER') THEN li."grossPay" ELSE 0 END), 0) as "adjustments",
        COALESCE(SUM(li."grossPay"), 0) as "total"
    FROM "amazon_invoice" ai
    JOIN "amazon_invoice_line_item" li ON li."invoiceId" = ai."id"
    WHERE ai."batchId" IS NOT NULL
    GROUP BY ai."batchId"
) sub
WHERE sub."batchId" = tb."id";

-- Step 13: Update batch status based on trip completion for non-invoiced batches
UPDATE "trip_batch" tb
SET "status" = CASE
    WHEN tb."tripCount" = 0 THEN 'EMPTY'::"BatchStatus"
    WHEN tb."completedCount" = tb."tripCount" - tb."canceledCount" THEN 'COMPLETED'::"BatchStatus"
    WHEN tb."completedCount" > 0 THEN 'IN_PROGRESS'::"BatchStatus"
    ELSE 'UPCOMING'::"BatchStatus"
END
WHERE tb."status" NOT IN ('INVOICED');

-- ============================================
-- CLEANUP: Drop old foreign keys, columns, and tables
-- ============================================

-- Step 14: Drop foreign keys from old columns
ALTER TABLE "amazon_invoice" DROP CONSTRAINT IF EXISTS "amazon_invoice_importBatchId_fkey";
ALTER TABLE "trip" DROP CONSTRAINT IF EXISTS "trip_importBatchId_fkey";
ALTER TABLE "trip" DROP CONSTRAINT IF EXISTS "trip_weekId_fkey";
ALTER TABLE "forecast_week" DROP CONSTRAINT IF EXISTS "forecast_week_userId_fkey";
ALTER TABLE "invoice_import_batch" DROP CONSTRAINT IF EXISTS "invoice_import_batch_userId_fkey";
ALTER TABLE "trip_import_batch" DROP CONSTRAINT IF EXISTS "trip_import_batch_userId_fkey";

-- Step 15: Drop old indexes
DROP INDEX IF EXISTS "amazon_invoice_importBatchId_idx";
DROP INDEX IF EXISTS "trip_importBatchId_idx";
DROP INDEX IF EXISTS "trip_weekId_idx";

-- Step 16: Drop old columns from trip and amazon_invoice
ALTER TABLE "amazon_invoice" DROP COLUMN IF EXISTS "importBatchId";
ALTER TABLE "trip" DROP COLUMN IF EXISTS "importBatchId";
ALTER TABLE "trip" DROP COLUMN IF EXISTS "weekId";

-- Step 17: Drop deprecated tables
DROP TABLE IF EXISTS "forecast_week";
DROP TABLE IF EXISTS "invoice_import_batch";
DROP TABLE IF EXISTS "trip_import_batch";

-- Step 18: Drop old enum
DROP TYPE IF EXISTS "ForecastStatus";

-- ============================================
-- FINAL: Add foreign keys for new columns
-- ============================================

-- Step 19: Add foreign keys for batchId columns
ALTER TABLE "trip" ADD CONSTRAINT "trip_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "trip_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "amazon_invoice" ADD CONSTRAINT "amazon_invoice_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "trip_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
