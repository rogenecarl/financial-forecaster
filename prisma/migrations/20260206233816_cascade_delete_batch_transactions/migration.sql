-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_transactionBatchId_fkey";

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_transactionBatchId_fkey" FOREIGN KEY ("transactionBatchId") REFERENCES "transaction_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
