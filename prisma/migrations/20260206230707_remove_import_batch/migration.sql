/*
  Warnings:

  - You are about to drop the column `importBatchId` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the `import_batch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_importBatchId_fkey";

-- DropIndex
DROP INDEX "transaction_importBatchId_idx";

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "importBatchId";

-- DropTable
DROP TABLE "import_batch";
