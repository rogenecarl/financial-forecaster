-- AlterTable
ALTER TABLE "amazon_invoice" ADD COLUMN     "importBatchId" TEXT;

-- AlterTable
ALTER TABLE "forecast_week" ADD COLUMN     "projectionLockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "originalProjectedLoads" INTEGER,
ADD COLUMN     "originalProjectedRevenue" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "trip_import_batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "tripCount" INTEGER NOT NULL,
    "newTripsCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "loadCount" INTEGER NOT NULL,
    "canceledCount" INTEGER NOT NULL DEFAULT 0,
    "projectedTours" INTEGER NOT NULL,
    "projectedLoads" INTEGER NOT NULL,
    "projectedTourPay" DECIMAL(12,2) NOT NULL,
    "projectedAccessorials" DECIMAL(12,2) NOT NULL,
    "projectedTotal" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,

    CONSTRAINT "trip_import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_import_batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceCount" INTEGER NOT NULL,
    "lineItemCount" INTEGER NOT NULL,
    "matchedTrips" INTEGER NOT NULL,
    "unmatchedTrips" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "invoice_import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_import_batch_userId_importedAt_idx" ON "trip_import_batch"("userId", "importedAt");

-- CreateIndex
CREATE INDEX "trip_import_batch_userId_periodStart_periodEnd_idx" ON "trip_import_batch"("userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "trip_import_batch_fileHash_idx" ON "trip_import_batch"("fileHash");

-- CreateIndex
CREATE INDEX "invoice_import_batch_userId_importedAt_idx" ON "invoice_import_batch"("userId", "importedAt");

-- CreateIndex
CREATE INDEX "amazon_invoice_importBatchId_idx" ON "amazon_invoice"("importBatchId");

-- CreateIndex
CREATE INDEX "forecast_week_userId_status_idx" ON "forecast_week"("userId", "status");

-- CreateIndex
CREATE INDEX "trip_userId_tripStage_idx" ON "trip"("userId", "tripStage");

-- CreateIndex
CREATE INDEX "trip_importBatchId_idx" ON "trip"("importBatchId");

-- AddForeignKey
ALTER TABLE "trip_import_batch" ADD CONSTRAINT "trip_import_batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_import_batch" ADD CONSTRAINT "invoice_import_batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amazon_invoice" ADD CONSTRAINT "amazon_invoice_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "invoice_import_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "trip_import_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
