import type { ForecastInput, ForecastResult } from "@/schema/forecasting.schema";
import { forecastInputSchema } from "@/schema/forecasting.schema";

/**
 * Calculate forecast results based on input parameters.
 * This is a pure function that can be used on both client and server.
 */
export function calculateForecast(input: ForecastInput): ForecastResult {
  const validated = forecastInputSchema.parse(input);

  const {
    truckCount,
    nightsPerWeek,
    toursPerTruck,
    avgLoadsPerTour,
    dtrRate,
    avgAccessorialRate,
    hourlyWage,
    hoursPerNight,
    includeOvertime,
    overtimeMultiplier,
    payrollTaxRate,
    workersCompRate,
    weeklyOverhead,
  } = validated;

  // Revenue calculation
  const weeklyTours = truckCount * nightsPerWeek * toursPerTruck;
  const weeklyLoads = Math.round(weeklyTours * avgLoadsPerTour);
  const tourPay = weeklyTours * dtrRate;
  const accessorialPay = weeklyLoads * avgAccessorialRate;
  const weeklyRevenue = tourPay + accessorialPay;

  // Labor cost calculation
  const regularHoursPerWeek = 40;
  const totalHoursPerDriver = nightsPerWeek * hoursPerNight;

  let laborCost = 0;
  for (let truck = 0; truck < truckCount; truck++) {
    const driverHours = totalHoursPerDriver;

    if (includeOvertime && driverHours > regularHoursPerWeek) {
      const regularPay = regularHoursPerWeek * hourlyWage;
      const overtimeHours = driverHours - regularHoursPerWeek;
      const overtimePay = overtimeHours * hourlyWage * overtimeMultiplier;
      laborCost += regularPay + overtimePay;
    } else {
      laborCost += driverHours * hourlyWage;
    }
  }

  // Payroll taxes and workers comp
  const payrollTax = laborCost * payrollTaxRate;
  const workersComp = laborCost * workersCompRate;

  // Total costs
  const weeklyCost = laborCost + payrollTax + workersComp + weeklyOverhead;

  // Profit
  const weeklyProfit = weeklyRevenue - weeklyCost;

  // Contribution margin (per truck per day)
  const contributionMargin =
    truckCount > 0 && nightsPerWeek > 0 ? weeklyProfit / truckCount / nightsPerWeek : 0;

  return {
    weeklyTours,
    weeklyLoads,
    tourPay: Math.round(tourPay * 100) / 100,
    accessorialPay: Math.round(accessorialPay * 100) / 100,
    weeklyRevenue: Math.round(weeklyRevenue * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    payrollTax: Math.round(payrollTax * 100) / 100,
    workersComp: Math.round(workersComp * 100) / 100,
    overhead: Math.round(weeklyOverhead * 100) / 100,
    weeklyCost: Math.round(weeklyCost * 100) / 100,
    weeklyProfit: Math.round(weeklyProfit * 100) / 100,
    contributionMargin: Math.round(contributionMargin * 100) / 100,
  };
}

/**
 * Generate a scaling table showing how profits scale with additional trucks.
 */
export function generateScalingTable(
  baseInput: ForecastInput,
  truckCounts: number[] = [2, 4, 6, 8, 10]
): Array<ForecastResult & { trucks: number }> {
  return truckCounts.map((trucks) => {
    const result = calculateForecast({
      ...baseInput,
      truckCount: trucks,
    });
    return { ...result, trucks };
  });
}
