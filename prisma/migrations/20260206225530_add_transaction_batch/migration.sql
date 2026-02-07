-- CreateEnum
CREATE TYPE "TransactionBatchStatus" AS ENUM ('EMPTY', 'ACTIVE', 'RECONCILED');

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "transactionBatchId" TEXT;

-- CreateTable
CREATE TABLE "transaction_batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TransactionBatchStatus" NOT NULL DEFAULT 'EMPTY',
    "lastImportFileName" TEXT,
    "lastImportedAt" TIMESTAMP(3),
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "uncategorizedCount" INTEGER NOT NULL DEFAULT 0,
    "netRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossProfit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "operatingIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "operatingMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_batch_userId_createdAt_idx" ON "transaction_batch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "transaction_batch_userId_status_idx" ON "transaction_batch"("userId", "status");

-- CreateIndex
CREATE INDEX "transaction_transactionBatchId_idx" ON "transaction"("transactionBatchId");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_transactionBatchId_fkey" FOREIGN KEY ("transactionBatchId") REFERENCES "transaction_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_batch" ADD CONSTRAINT "transaction_batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
