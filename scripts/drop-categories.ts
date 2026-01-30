import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🗑️  Dropping all categories...");
  
  // First, check current state
  const categoryCount = await prisma.category.count();
  const ruleCount = await prisma.categoryRule.count();
  const txWithCategory = await prisma.transaction.count({
    where: { categoryId: { not: null } }
  });
  
  console.log(`   Found ${categoryCount} categories`);
  console.log(`   Found ${ruleCount} category rules (will be cascade deleted)`);
  console.log(`   Found ${txWithCategory} transactions with categories (will be set to null)`);
  
  // Delete all category rules first (cascade would handle this, but being explicit)
  const deletedRules = await prisma.categoryRule.deleteMany({});
  console.log(`   ✓ Deleted ${deletedRules.count} category rules`);
  
  // Set all transaction categoryIds to null
  const updatedTx = await prisma.transaction.updateMany({
    where: { categoryId: { not: null } },
    data: { categoryId: null }
  });
  console.log(`   ✓ Cleared categoryId from ${updatedTx.count} transactions`);
  
  // Delete all categories
  const deletedCategories = await prisma.category.deleteMany({});
  console.log(`   ✓ Deleted ${deletedCategories.count} categories`);
  
  console.log("\n✅ All categories dropped successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
