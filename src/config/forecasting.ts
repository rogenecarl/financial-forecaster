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
   * Average Accessorial Rate per Load
   * This is the average payout per completed load delivery.
   * Calculated from historical invoice data (average of LOAD_COMPLETED gross pay).
   */
  LOAD_ACCESSORIAL_RATE: 34.12,
} as const;

export type ForecastingConstants = typeof FORECASTING_CONSTANTS;
