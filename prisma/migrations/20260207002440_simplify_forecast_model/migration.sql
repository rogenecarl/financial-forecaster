-- Simplify Forecast model: remove labor/cost fields, keep only trip-based revenue forecasting

-- Step 1: Add new columns with defaults
ALTER TABLE "forecast" ADD COLUMN "numberOfTrips" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "forecast" ADD COLUMN "avgAccessorialPerTrip" DECIMAL(10,2) NOT NULL DEFAULT 70;
ALTER TABLE "forecast" ADD COLUMN "revenuePerTrip" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "forecast" ADD COLUMN "monthlyRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "forecast" ADD COLUMN "annualRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Step 2: Migrate existing data
UPDATE "forecast" SET
  "numberOfTrips" = "truckCount" * "nightsPerWeek" * "toursPerTruck",
  "avgAccessorialPerTrip" = "avgAccessorialRate",
  "revenuePerTrip" = "dtrRate" + "avgAccessorialRate",
  "monthlyRevenue" = "weeklyRevenue" * 4.33,
  "annualRevenue" = "weeklyRevenue" * 52;

-- Step 3: Update dtrRate default
ALTER TABLE "forecast" ALTER COLUMN "dtrRate" SET DEFAULT 452.09;

-- Step 4: Drop old columns
ALTER TABLE "forecast" DROP COLUMN "avgAccessorialRate",
DROP COLUMN "avgLoadsPerTour",
DROP COLUMN "contributionMargin",
DROP COLUMN "hourlyWage",
DROP COLUMN "hoursPerNight",
DROP COLUMN "nightsPerWeek",
DROP COLUMN "overtimeMultiplier",
DROP COLUMN "payrollTaxRate",
DROP COLUMN "toursPerTruck",
DROP COLUMN "truckCount",
DROP COLUMN "weeklyLaborCost",
DROP COLUMN "weeklyOverhead",
DROP COLUMN "weeklyProfit",
DROP COLUMN "workersCompRate";
