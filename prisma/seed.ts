import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CategoryType } from "../src/lib/generated/prisma/client";

// Setup database connection for seeding
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// DEFAULT CATEGORIES
// Based on new-business-account-transaction-sample.md
// Category names must match exactly for CSV import matching
// ============================================

const defaultCategories = [
  // ═══════════════════════════════════════════════════════════════════════════
  // REVENUE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Amazon Relay Payment",
    type: CategoryType.REVENUE,
    color: "#22c55e",
    isSystem: true,
    sortOrder: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRA-REVENUE (reduces revenue - refunds are positive amounts)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Amazon marketplace refunds",
    type: CategoryType.CONTRA_REVENUE,
    color: "#f97316",
    isSystem: false,
    sortOrder: 5,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COST OF GOODS SOLD (Direct costs)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Driver Wages",
    type: CategoryType.COGS,
    color: "#ef4444",
    isSystem: true,
    sortOrder: 10,
  },
  {
    name: "Payroll Taxes",
    type: CategoryType.COGS,
    color: "#dc2626",
    isSystem: true,
    sortOrder: 11,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATING EXPENSES (Indirect costs)
  // Sorted by total amount from the sample data
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Telecom & Mobile Devices",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#3b82f6",
    isSystem: false,
    sortOrder: 20,
  },
  {
    name: "Office Supplies",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#6366f1",
    isSystem: false,
    sortOrder: 21,
  },
  {
    name: "Cargo Insurance",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#8b5cf6",
    isSystem: false,
    sortOrder: 22,
  },
  {
    name: "Virtual Assistants Contractor fee",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#a855f7",
    isSystem: false,
    sortOrder: 23,
  },
  {
    name: "Business Travel",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#d946ef",
    isSystem: false,
    sortOrder: 24,
  },
  {
    name: "Payroll Service Fees",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#ec4899",
    isSystem: false,
    sortOrder: 25,
  },
  {
    name: "Truck Fuel",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#f43f5e",
    isSystem: false,
    sortOrder: 26,
  },
  {
    name: "Recruiting Ads",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#fb7185",
    isSystem: false,
    sortOrder: 27,
  },
  {
    name: "DOT Physical Expense",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#f97316",
    isSystem: false,
    sortOrder: 28,
  },
  {
    name: "Travel meal per diem",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#fb923c",
    isSystem: false,
    sortOrder: 29,
  },
  {
    name: "Office Phone",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#fbbf24",
    isSystem: false,
    sortOrder: 30,
  },
  {
    name: "Software",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#facc15",
    isSystem: false,
    sortOrder: 31,
  },
  {
    name: "Office Email fee",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#a3e635",
    isSystem: false,
    sortOrder: 32,
  },
  {
    name: "Website domain purchase",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#4ade80",
    isSystem: false,
    sortOrder: 33,
  },
  {
    name: "Chase Business Account Monthly Fee",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#64748b",
    isSystem: false,
    sortOrder: 34,
  },
  {
    name: "Business Check Fee",
    type: CategoryType.OPERATING_EXPENSE,
    color: "#475569",
    isSystem: false,
    sortOrder: 35,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EQUITY (Not in P&L)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Owner Contribution",
    type: CategoryType.EQUITY,
    color: "#8b5cf6",
    isSystem: false,
    sortOrder: 90,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNCATEGORIZED
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Uncategorized",
    type: CategoryType.UNCATEGORIZED,
    color: "#cbd5e1",
    isSystem: true,
    sortOrder: 99,
  },
];

// ============================================
// DEFAULT CATEGORY RULES
// Based on transaction sample patterns
// ============================================

interface CategoryRuleData {
  pattern: string;
  matchType: string;
  field: string;
  categoryName: string;
  priority: number;
}

const defaultCategoryRules: CategoryRuleData[] = [
  // ─── Revenue ───────────────────────────────────────────────────────────────
  { pattern: "Amazon Relay Payment", matchType: "contains", field: "description", categoryName: "Amazon Relay Payment", priority: 100 },
  { pattern: "AMAZON.COM SERVICES", matchType: "contains", field: "description", categoryName: "Amazon Relay Payment", priority: 100 },
  { pattern: "AMAZON EDI PAYMENTS", matchType: "contains", field: "description", categoryName: "Amazon Relay Payment", priority: 100 },

  // ─── Contra-Revenue ────────────────────────────────────────────────────────
  { pattern: "Amazon Marketplace Refund", matchType: "contains", field: "description", categoryName: "Amazon marketplace refunds", priority: 95 },

  // ─── COGS ──────────────────────────────────────────────────────────────────
  { pattern: "ADP Wage Pay", matchType: "contains", field: "description", categoryName: "Driver Wages", priority: 90 },
  { pattern: "ADP Tax", matchType: "contains", field: "description", categoryName: "Payroll Taxes", priority: 90 },
  { pattern: "Check 7720", matchType: "contains", field: "description", categoryName: "Driver Wages", priority: 85 },

  // ─── Operating Expenses ────────────────────────────────────────────────────
  { pattern: "Amazon Insurance", matchType: "contains", field: "description", categoryName: "Cargo Insurance", priority: 90 },
  { pattern: "ATT Payment", matchType: "contains", field: "description", categoryName: "Telecom & Mobile Devices", priority: 85 },
  { pattern: "Wise Inc", matchType: "contains", field: "description", categoryName: "Virtual Assistants Contractor fee", priority: 85 },
  { pattern: "ADP Payroll Fees", matchType: "contains", field: "description", categoryName: "Payroll Service Fees", priority: 85 },
  { pattern: "OpenPhone", matchType: "contains", field: "description", categoryName: "Office Phone", priority: 80 },
  { pattern: "Indeed", matchType: "contains", field: "description", categoryName: "Recruiting Ads", priority: 80 },
  { pattern: "Monday.com", matchType: "contains", field: "description", categoryName: "Software", priority: 80 },
  { pattern: "OnlineJobsPH", matchType: "contains", field: "description", categoryName: "Software", priority: 80 },
  { pattern: "Namecheap - Domain", matchType: "contains", field: "description", categoryName: "Website domain purchase", priority: 75 },
  { pattern: "Namecheap - Email", matchType: "contains", field: "description", categoryName: "Office Email fee", priority: 75 },
  { pattern: "Namecheap", matchType: "contains", field: "description", categoryName: "Office Email fee", priority: 70 },

  // Office Supplies (various retailers)
  { pattern: "Home Depot", matchType: "contains", field: "description", categoryName: "Office Supplies", priority: 70 },
  { pattern: "Target", matchType: "contains", field: "description", categoryName: "Office Supplies", priority: 70 },
  { pattern: "Amazon Marketplace", matchType: "contains", field: "description", categoryName: "Office Supplies", priority: 65 },
  { pattern: "Amazon.com", matchType: "contains", field: "description", categoryName: "Office Supplies", priority: 65 },
  { pattern: "OfficeMax", matchType: "contains", field: "description", categoryName: "Office Supplies", priority: 70 },
  { pattern: "O'Reilly", matchType: "contains", field: "description", categoryName: "Office Supplies", priority: 70 },

  // Fuel stations
  { pattern: "Marathon", matchType: "contains", field: "description", categoryName: "Truck Fuel", priority: 75 },
  { pattern: "Kwik Trip", matchType: "contains", field: "description", categoryName: "Truck Fuel", priority: 75 },
  { pattern: "BP -", matchType: "contains", field: "description", categoryName: "Truck Fuel", priority: 75 },
  { pattern: "Shell Oil", matchType: "contains", field: "description", categoryName: "Truck Fuel", priority: 75 },
  { pattern: "Holiday Stations", matchType: "contains", field: "description", categoryName: "Truck Fuel", priority: 75 },
  { pattern: "Exxon", matchType: "contains", field: "description", categoryName: "Truck Fuel", priority: 75 },

  // Travel
  { pattern: "Delta Air", matchType: "contains", field: "description", categoryName: "Business Travel", priority: 70 },
  { pattern: "Sun Country Air", matchType: "contains", field: "description", categoryName: "Business Travel", priority: 70 },
  { pattern: "Skiplagged", matchType: "contains", field: "description", categoryName: "Business Travel", priority: 70 },

  // Meals
  { pattern: "Humbertos", matchType: "contains", field: "description", categoryName: "Travel meal per diem", priority: 65 },
  { pattern: "In-N-Out", matchType: "contains", field: "description", categoryName: "Travel meal per diem", priority: 65 },
  { pattern: "Bisbas", matchType: "contains", field: "description", categoryName: "Travel meal per diem", priority: 65 },

  // Medical/DOT
  { pattern: "CompCare", matchType: "contains", field: "description", categoryName: "DOT Physical Expense", priority: 70 },
  { pattern: "Back To Health", matchType: "contains", field: "description", categoryName: "DOT Physical Expense", priority: 70 },

  // Bank fees
  { pattern: "Monthly Service Fee", matchType: "contains", field: "description", categoryName: "Chase Business Account Monthly Fee", priority: 80 },
  { pattern: "Counter Check", matchType: "contains", field: "description", categoryName: "Business Check Fee", priority: 80 },

  // ─── Equity ────────────────────────────────────────────────────────────────
  { pattern: "ATM Cash Deposit", matchType: "contains", field: "description", categoryName: "Owner Contribution", priority: 90 },
  { pattern: "Initial Deposit", matchType: "contains", field: "description", categoryName: "Owner Contribution", priority: 90 },
];

async function main() {
  console.log("🌱 Starting database seed...");

  // Create categories
  console.log("📁 Creating categories...");
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        type: category.type,
        color: category.color,
        isSystem: category.isSystem,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
  }
  console.log(`   ✓ Created/updated ${defaultCategories.length} categories`);

  // Get all categories for rule creation
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  // Note: Category rules require a userId. They will be created when:
  // 1. A user is created and initializes their settings
  // 2. An admin creates global rules
  // For now, we store the rule templates for reference

  console.log("📋 Category rule templates ready for user initialization");
  console.log(`   Template has ${defaultCategoryRules.length} rules`);

  // Verify category mappings
  const unmappedRules = defaultCategoryRules.filter(
    (r) => !categoryMap.has(r.categoryName)
  );
  if (unmappedRules.length > 0) {
    console.log("⚠️  Warning: Some rules reference unmapped categories:");
    unmappedRules.forEach((r) => console.log(`   - ${r.categoryName}`));
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\nSummary:");
  console.log(`   - ${defaultCategories.length} categories created/updated`);
  console.log(`   - Category types:`);
  console.log(`     • REVENUE: ${defaultCategories.filter((c) => c.type === CategoryType.REVENUE).length}`);
  console.log(`     • CONTRA_REVENUE: ${defaultCategories.filter((c) => c.type === CategoryType.CONTRA_REVENUE).length}`);
  console.log(`     • COGS: ${defaultCategories.filter((c) => c.type === CategoryType.COGS).length}`);
  console.log(`     • OPERATING_EXPENSE: ${defaultCategories.filter((c) => c.type === CategoryType.OPERATING_EXPENSE).length}`);
  console.log(`     • EQUITY: ${defaultCategories.filter((c) => c.type === CategoryType.EQUITY).length}`);
  console.log(`     • UNCATEGORIZED: ${defaultCategories.filter((c) => c.type === CategoryType.UNCATEGORIZED).length}`);
  console.log(`   - ${defaultCategoryRules.length} category rule templates available`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

// Export for potential use in other scripts
export { defaultCategories, defaultCategoryRules };
