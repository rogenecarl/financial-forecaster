/**
 * Forecasting Constants
 *
 * These values are used across the application for revenue projections.
 * Update these when rates change.
 */
export const FORECASTING_CONSTANTS = {
  /**
   * Daily Trip Rate (DTR) - Base pay per completed trip/tour
   * This is the guaranteed minimum pay for completing a tour.
   */
  DTR_RATE: 452.09,

  /**
   * Accessorial Rate per Trip
   * This is the flat payout per trip ID (not per load).
   */
  TRIP_ACCESSORIAL_RATE: 70,
} as const;

export type ForecastingConstants = typeof FORECASTING_CONSTANTS;
