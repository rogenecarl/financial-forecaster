import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CategoryType } from "../src/lib/generated/prisma/client";

// Setup database connection for seeding
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  // Revenue
  {
    name: "Amazon Payout",
    type: CategoryType.REVENUE,
    color: "#22c55e",
    icon: "DollarSign",
    isSystem: true,
    sortOrder: 1,
  },
  {
    name: "Other Income",
    type: CategoryType.REVENUE,
    color: "#16a34a",
    icon: "Plus",
    sortOrder: 2,
  },

  // Expenses - Included in P&L
  {
    name: "Driver Wages",
    type: CategoryType.EXPENSE,
    color: "#3b82f6",
    icon: "Users",
    includeInPL: true,
    isSystem: true,
    sortOrder: 10,
  },
  {
    name: "Payroll Taxes",
    type: CategoryType.EXPENSE,
    color: "#6366f1",
    icon: "Receipt",
    includeInPL: true,
    isSystem: true,
    sortOrder: 11,
  },
  {
    name: "Workers Comp",
    type: CategoryType.EXPENSE,
    color: "#8b5cf6",
    icon: "Shield",
    includeInPL: true,
    isSystem: true,
    sortOrder: 12,
  },
  {
    name: "Insurance",
    type: CategoryType.EXPENSE,
    color: "#a855f7",
    icon: "FileCheck",
    includeInPL: true,
    isSystem: true,
    sortOrder: 13,
  },
  {
    name: "Admin/Overhead",
    type: CategoryType.EXPENSE,
    color: "#ec4899",
    icon: "Building",
    includeInPL: true,
    sortOrder: 14,
  },
  {
    name: "Bank Fees",
    type: CategoryType.EXPENSE,
    color: "#f43f5e",
    icon: "CreditCard",
    includeInPL: true,
    sortOrder: 15,
  },

  // Expenses - Excluded from P&L (per PRD)
  {
    name: "Fuel",
    type: CategoryType.EXPENSE,
    color: "#f97316",
    icon: "Fuel",
    includeInPL: false,
    sortOrder: 20,
  },
  {
    name: "Maintenance",
    type: CategoryType.EXPENSE,
    color: "#eab308",
    icon: "Wrench",
    includeInPL: false,
    sortOrder: 21,
  },

  // Transfers
  {
    name: "Cash Transfer",
    type: CategoryType.TRANSFER,
    color: "#64748b",
    icon: "ArrowLeftRight",
    includeInPL: false,
    sortOrder: 30,
  },
  {
    name: "Personal/Excluded",
    type: CategoryType.TRANSFER,
    color: "#94a3b8",
    icon: "UserX",
    includeInPL: false,
    sortOrder: 31,
  },

  // Unknown
  {
    name: "Uncategorized",
    type: CategoryType.UNKNOWN,
    color: "#cbd5e1",
    icon: "HelpCircle",
    includeInPL: false,
    isSystem: true,
    sortOrder: 99,
  },
];

interface CategoryRuleData {
  pattern: string;
  matchType: string;
  field: string;
  categoryName: string;
  priority: number;
}

const defaultCategoryRules: CategoryRuleData[] = [
  // Revenue patterns
  {
    pattern: "AMAZON.COM SERVICES",
    matchType: "contains",
    field: "description",
    categoryName: "Amazon Payout",
    priority: 100,
  },
  {
    pattern: "AMAZON EDI PAYMENTS",
    matchType: "contains",
    field: "description",
    categoryName: "Amazon Payout",
    priority: 100,
  },

  // Payroll patterns
  {
    pattern: "ADP WAGE PAY",
    matchType: "contains",
    field: "description",
    categoryName: "Driver Wages",
    priority: 90,
  },
  {
    pattern: "ADP Tax",
    matchType: "contains",
    field: "description",
    categoryName: "Payroll Taxes",
    priority: 90,
  },
  {
    pattern: "ADP PAYROLL FEES",
    matchType: "contains",
    field: "description",
    categoryName: "Admin/Overhead",
    priority: 90,
  },

  // Insurance
  {
    pattern: "AMAZON INSURANCE",
    matchType: "contains",
    field: "description",
    categoryName: "Insurance",
    priority: 90,
  },

  // Workers Comp
  {
    pattern: "Wise Inc",
    matchType: "contains",
    field: "description",
    categoryName: "Workers Comp",
    priority: 80,
  },

  // Admin/Overhead
  {
    pattern: "OPENPHONE",
    matchType: "contains",
    field: "description",
    categoryName: "Admin/Overhead",
    priority: 70,
  },
  {
    pattern: "QUO (OPENPHONE)",
    matchType: "contains",
    field: "description",
    categoryName: "Admin/Overhead",
    priority: 70,
  },
  {
    pattern: "NAME-CHEAP",
    matchType: "contains",
    field: "description",
    categoryName: "Admin/Overhead",
    priority: 70,
  },
  {
    pattern: "Monday.com",
    matchType: "contains",
    field: "description",
    categoryName: "Admin/Overhead",
    priority: 70,
  },
  {
    pattern: "INDEED",
    matchType: "contains",
    field: "description",
    categoryName: "Admin/Overhead",
    priority: 70,
  },

  // Bank fees
  {
    pattern: "MONTHLY SERVICE FEE",
    matchType: "contains",
    field: "description",
    categoryName: "Bank Fees",
    priority: 80,
  },
  {
    pattern: "COUNTER CHECK",
    matchType: "contains",
    field: "description",
    categoryName: "Bank Fees",
    priority: 80,
  },

  // Fuel stations
  {
    pattern: "MARATHON",
    matchType: "contains",
    field: "description",
    categoryName: "Fuel",
    priority: 60,
  },
  {
    pattern: "KWIK TRIP",
    matchType: "contains",
    field: "description",
    categoryName: "Fuel",
    priority: 60,
  },
  {
    pattern: "BP#",
    matchType: "contains",
    field: "description",
    categoryName: "Fuel",
    priority: 60,
  },
  {
    pattern: "SHELL OIL",
    matchType: "contains",
    field: "description",
    categoryName: "Fuel",
    priority: 60,
  },
  {
    pattern: "HOLIDAY STATIONS",
    matchType: "contains",
    field: "description",
    categoryName: "Fuel",
    priority: 60,
  },
  {
    pattern: "EXXON",
    matchType: "contains",
    field: "description",
    categoryName: "Fuel",
    priority: 60,
  },

  // Maintenance
  {
    pattern: "O'REILLY",
    matchType: "contains",
    field: "description",
    categoryName: "Maintenance",
    priority: 60,
  },
];

async function main() {
  console.log("🌱 Starting database seed...");

  // Create categories
  console.log("📁 Creating categories...");
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }
  console.log(`   ✓ Created ${defaultCategories.length} categories`);

  // Get all categories for rule creation (for future use)
  const categories = await prisma.category.findMany();
  // Category map available for creating user-specific rules
  void categories;

  // Create a system user for global rules (or skip if no users)
  // Note: Category rules require a userId. In a real scenario,
  // you might want to create rules per user or have a system user.
  // For now, we'll skip creating rules in seed and let them be created
  // when users are created or via settings.

  console.log(
    "📋 Category rules template ready (will be created per user in settings)"
  );
  console.log(`   Template has ${defaultCategoryRules.length} rules`);

  console.log("\n✅ Seed completed successfully!");
  console.log("\nSummary:");
  console.log(`   - ${defaultCategories.length} categories created/updated`);
  console.log(
    `   - ${defaultCategoryRules.length} category rule templates available`
  );
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
