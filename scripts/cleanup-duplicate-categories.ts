/**
 * Script to find and clean up duplicate categories in the database
 *
 * Run with: npx tsx scripts/cleanup-duplicate-categories.ts
 *
 * Options:
 *   --dry-run    Only show what would be done, don't make changes
 *   --normalize  Also normalize category names (trim, collapse spaces)
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/lib/generated/prisma/client";

// Setup database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldNormalize = args.includes("--normalize");

// Normalize category name for comparison
function normalizeForComparison(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// Normalize category name for storage
function normalizeForStorage(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

interface CategoryWithCounts {
  id: string;
  name: string;
  type: string;
  isSystem: boolean;
  createdAt: Date;
  transactionCount: number;
  ruleCount: number;
}

async function main() {
  console.log("🔍 Scanning for duplicate categories...\n");

  if (isDryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made\n");
  }

  // Get all categories with counts
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          transactions: true,
          categoryRules: true,
        },
      },
    },
  });

  const categoriesWithCounts: CategoryWithCounts[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    isSystem: cat.isSystem,
    createdAt: cat.createdAt,
    transactionCount: cat._count.transactions,
    ruleCount: cat._count.categoryRules,
  }));

  // Group by normalized name
  const groups = new Map<string, CategoryWithCounts[]>();
  for (const cat of categoriesWithCounts) {
    const key = normalizeForComparison(cat.name);
    const existing = groups.get(key) || [];
    existing.push(cat);
    groups.set(key, existing);
  }

  // Find duplicates
  const duplicateGroups: { normalizedName: string; categories: CategoryWithCounts[] }[] = [];
  for (const [normalizedName, cats] of groups.entries()) {
    if (cats.length > 1) {
      duplicateGroups.push({ normalizedName, categories: cats });
    }
  }

  if (duplicateGroups.length === 0) {
    console.log("✅ No duplicate categories found!\n");
  } else {
    console.log(`⚠️  Found ${duplicateGroups.length} group(s) of duplicate categories:\n`);

    let totalTransactionsReassigned = 0;
    let totalRulesReassigned = 0;
    let totalCategoriesDeleted = 0;

    for (const group of duplicateGroups) {
      // Primary is the system category, or the one with most transactions, or oldest
      const sorted = [...group.categories].sort((a, b) => {
        // System categories first
        if (a.isSystem && !b.isSystem) return -1;
        if (!a.isSystem && b.isSystem) return 1;
        // Then by transaction count (more is better)
        if (b.transactionCount !== a.transactionCount) {
          return b.transactionCount - a.transactionCount;
        }
        // Then by age (older is better)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      console.log(`📁 "${group.normalizedName}":`);
      console.log(`   ✓ Keep: "${primary.name}" (${primary.transactionCount} transactions, ${primary.ruleCount} rules, ${primary.isSystem ? "system" : "user"})`);

      for (const dup of duplicates) {
        console.log(`   ✗ Merge: "${dup.name}" (${dup.transactionCount} transactions, ${dup.ruleCount} rules)`);

        if (!isDryRun) {
          // Reassign transactions
          if (dup.transactionCount > 0) {
            await prisma.transaction.updateMany({
              where: { categoryId: dup.id },
              data: { categoryId: primary.id },
            });
            totalTransactionsReassigned += dup.transactionCount;
          }

          // Handle category rules
          if (dup.ruleCount > 0) {
            const dupRules = await prisma.categoryRule.findMany({
              where: { categoryId: dup.id },
            });

            for (const rule of dupRules) {
              // Check if primary already has a similar rule
              const existingRule = await prisma.categoryRule.findFirst({
                where: {
                  categoryId: primary.id,
                  pattern: rule.pattern,
                  matchType: rule.matchType,
                  field: rule.field,
                },
              });

              if (existingRule) {
                // Delete duplicate rule
                await prisma.categoryRule.delete({
                  where: { id: rule.id },
                });
              } else {
                // Reassign to primary
                await prisma.categoryRule.update({
                  where: { id: rule.id },
                  data: { categoryId: primary.id },
                });
                totalRulesReassigned++;
              }
            }
          }

          // Delete duplicate category
          await prisma.category.delete({
            where: { id: dup.id },
          });
          totalCategoriesDeleted++;
        }
      }
      console.log("");
    }

    if (!isDryRun) {
      console.log("📊 Summary:");
      console.log(`   - Categories deleted: ${totalCategoriesDeleted}`);
      console.log(`   - Transactions reassigned: ${totalTransactionsReassigned}`);
      console.log(`   - Rules reassigned: ${totalRulesReassigned}`);
      console.log("");
    }
  }

  // Normalize category names if requested
  if (shouldNormalize) {
    console.log("📝 Normalizing category names...\n");

    const allCategories = await prisma.category.findMany();
    let normalizedCount = 0;

    for (const cat of allCategories) {
      const normalized = normalizeForStorage(cat.name);
      if (normalized !== cat.name) {
        console.log(`   "${cat.name}" → "${normalized}"`);
        if (!isDryRun) {
          try {
            await prisma.category.update({
              where: { id: cat.id },
              data: { name: normalized },
            });
            normalizedCount++;
          } catch (error) {
            console.log(`   ⚠️  Skipped (conflict with existing category)`);
          }
        }
      }
    }

    if (normalizedCount === 0 && !isDryRun) {
      console.log("   All category names are already normalized\n");
    } else if (!isDryRun) {
      console.log(`\n   Normalized ${normalizedCount} category name(s)\n`);
    }
  }

  console.log("✅ Done!\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
