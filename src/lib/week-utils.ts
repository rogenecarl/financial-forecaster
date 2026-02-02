import { startOfWeek, getWeek, getYear, addWeeks } from "date-fns";

/**
 * Generate a week ID string from a date
 * Format: "2026-W05"
 */
export function getWeekId(date: Date): string {
  const year = getYear(date);
  const week = getWeek(date, { weekStartsOn: 1 });
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

/**
 * Parse a week ID string into year and week number
 */
export function parseWeekId(weekId: string): { year: number; weekNumber: number } {
  const [yearStr, weekStr] = weekId.split("-W");
  return {
    year: parseInt(yearStr, 10),
    weekNumber: parseInt(weekStr, 10),
  };
}

/**
 * Get the start date (Monday) from a week ID
 */
export function getWeekStartFromId(weekId: string): Date {
  const { year, weekNumber } = parseWeekId(weekId);
  // Get Jan 4 of the year (always in week 1)
  const jan4 = new Date(year, 0, 4);
  const jan4Week = getWeek(jan4, { weekStartsOn: 1 });
  const weeksDiff = weekNumber - jan4Week;
  const targetDate = addWeeks(jan4, weeksDiff);
  return startOfWeek(targetDate, { weekStartsOn: 1 });
}
