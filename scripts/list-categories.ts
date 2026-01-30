import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { name: true, type: true, sortOrder: true }
  });
  
  console.log("📋 Categories in database:\n");
  console.log("| # | Name | Type |");
  console.log("|---|------|------|");
  categories.forEach((c, i) => {
    console.log(`| ${i+1} | ${c.name} | ${c.type} |`);
  });
  console.log(`\nTotal: ${categories.length} categories`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); });
