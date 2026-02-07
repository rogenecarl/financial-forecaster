import type { ForecastInput, ForecastResult } from "@/schema/forecasting.schema";
import { forecastInputSchema } from "@/schema/forecasting.schema";

/**
 * Calculate forecast results based on input parameters.
 * Revenue = numberOfTrips × (DTR + avgAccessorialPerTrip)
 */
export function calculateForecast(input: ForecastInput): ForecastResult {
  const validated = forecastInputSchema.parse(input);

  const { numberOfTrips, dtrRate, avgAccessorialPerTrip } = validated;

  const revenuePerTrip = dtrRate + avgAccessorialPerTrip;
  const weeklyRevenue = numberOfTrips * revenuePerTrip;
  const monthlyRevenue = weeklyRevenue * 4.33;
  const annualRevenue = weeklyRevenue * 52;

  return {
    revenuePerTrip: Math.round(revenuePerTrip * 100) / 100,
    weeklyRevenue: Math.round(weeklyRevenue * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    annualRevenue: Math.round(annualRevenue * 100) / 100,
  };
}

/**
 * Generate a scaling table showing how revenue scales with additional trips.
 */
export function generateScalingTable(
  baseInput: ForecastInput,
  tripCounts: number[] = [7, 14, 21, 28, 35]
): Array<ForecastResult & { trips: number }> {
  return tripCounts.map((trips) => {
    const result = calculateForecast({
      ...baseInput,
      numberOfTrips: trips,
    });
    return { ...result, trips };
  });
}
