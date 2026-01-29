import Papa from "papaparse";
import type { ImportTrip, CreateTripLoad, TripStage } from "@/schema/forecasting.schema";

// ============================================
// TYPES
// ============================================

export interface TripsParseResult {
  success: boolean;
  trips: ImportTrip[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    totalTrips: number;
    totalLoads: number;
    bobtailLoads: number;
    canceledTrips: number;
  };
}

interface RawTripRow {
  [key: string]: string | number | undefined;
}

// ============================================
// COLUMN MAPPING (Tab-delimited CSV from Amazon Scheduler)
// ============================================

const columnMappings: Record<string, string[]> = {
  tripId: ["trip id", "tripid", "trip_id"],
  tripStage: ["trip stage", "tripstage", "trip_stage", "stage"],
  loadId: ["load id", "loadid", "load_id"],
  facilitySequence: ["facility sequence", "facilitysequence", "facility_sequence", "route"],
  loadExecutionStatus: ["load execution status", "loadexecutionstatus", "execution status", "status"],
  transitOperatorType: ["transit operator type", "operatortype", "operator type", "operator"],
  equipmentType: ["equipment type", "equipmenttype", "equipment"],
  estimateDistance: ["estimate distance", "estimatedistance", "distance", "miles"],
  estimatedCost: ["estimated cost", "estimatedcost", "cost", "accessorial"],
  truckFilter: ["truck filter", "truckfilter", "truck_filter"],
  shipperAccount: ["shipper account", "shipperaccount", "shipper"],
  stop1: ["stop 1", "stop1"],
  stop1PlannedArrivalDate: ["stop 1 planned arrival date", "stop1plannedarrivaldate"],
  stop1PlannedArrivalTime: ["stop 1 planned arrival time", "stop1plannedarrivaltime"],
  stop2: ["stop 2", "stop2"],
  stop2PlannedArrivalDate: ["stop 2 planned arrival date"],
  stop2PlannedArrivalTime: ["stop 2 planned arrival time"],
  stop3: ["stop 3", "stop3"],
  stop3PlannedArrivalDate: ["stop 3 planned arrival date"],
  stop3PlannedArrivalTime: ["stop 3 planned arrival time"],
  stop4: ["stop 4", "stop4"],
  stop4PlannedArrivalDate: ["stop 4 planned arrival date"],
  stop4PlannedArrivalTime: ["stop 4 planned arrival time"],
  stop5: ["stop 5", "stop5"],
  stop5PlannedArrivalDate: ["stop 5 planned arrival date"],
  stop5PlannedArrivalTime: ["stop 5 planned arrival time"],
  stop6: ["stop 6", "stop6"],
  stop6PlannedArrivalDate: ["stop 6 planned arrival date"],
  stop6PlannedArrivalTime: ["stop 6 planned arrival time"],
  stop7: ["stop 7", "stop7"],
  stop7PlannedArrivalDate: ["stop 7 planned arrival date"],
  stop7PlannedArrivalTime: ["stop 7 planned arrival time"],
};

function normalizeColumnName(col: string): string {
  return col.toLowerCase().trim().replace(/[_-]/g, " ");
}

function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));

  for (const [field, aliases] of Object.entries(columnMappings)) {
    for (const alias of aliases) {
      const index = normalizedHeaders.indexOf(alias);
      if (index !== -1) {
        mapping[field] = headers[index];
        break;
      }
    }
  }

  return mapping;
}

// ============================================
// DATE PARSING
// ============================================

function parseDateTime(dateStr: string | undefined, timeStr: string | undefined): Date | null {
  if (!dateStr) return null;

  try {
    // Handle various date formats: "1/26/26", "01/26/2026", "Jan 26, 2026"
    let date = dateStr.toString().trim();

    // If year is 2-digit, assume 20xx
    const shortYearMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (shortYearMatch) {
      const [, month, day, year] = shortYearMatch;
      date = `${month}/${day}/20${year}`;
    }

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return null;

    // Add time if provided
    if (timeStr) {
      const time = timeStr.toString().trim();
      // Handle "0:20" format (hours:minutes)
      const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        parsed.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

// ============================================
// PARSING LOGIC
// ============================================

function parseTripStage(stage: string | undefined): TripStage {
  if (!stage) return "UPCOMING";
  const s = stage.toString().toUpperCase().trim();
  if (s.includes("CANCEL")) return "CANCELED";
  if (s.includes("PROGRESS") || s.includes("ACTIVE")) return "IN_PROGRESS";
  if (s.includes("COMPLETE")) return "COMPLETED";
  return "UPCOMING";
}

function isBobtail(truckFilter: string | null | undefined): boolean {
  if (!truckFilter) return false;
  return truckFilter.toString().toLowerCase().includes("bobtailmovementannotation");
}

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;
  const num = parseFloat(value.toString().replace(/[$,]/g, ""));
  return isNaN(num) ? 0 : num;
}

function countDeliveryStops(
  load: CreateTripLoad,
  excludedAddresses: string[]
): number {
  // Skip bobtail loads
  if (load.isBobtail) return 0;

  // Count stops 2-7 that are NOT in excluded addresses
  const stops = [load.stop2, load.stop3, load.stop4, load.stop5, load.stop6, load.stop7];

  let count = 0;
  for (const stop of stops) {
    if (stop && !excludedAddresses.includes(stop.toUpperCase())) {
      count++;
    }
  }

  return count;
}

// ============================================
// MAIN PARSER
// ============================================

export function parseTripsCSV(
  content: string,
  excludedAddresses: string[] = ["MSP7", "MSP8", "MSP9"]
): TripsParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tripMap = new Map<string, { trip: Partial<ImportTrip>; loads: CreateTripLoad[] }>();

  let totalRows = 0;
  let bobtailLoads = 0;

  try {
    // Parse as tab-delimited or comma-delimited
    const lines = content.trim().split("\n");
    const firstLine = lines[0] || "";
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const delimiter = tabCount > 3 ? "\t" : ",";

    const result = Papa.parse<RawTripRow>(content, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      for (const err of result.errors) {
        if (err.type !== "FieldMismatch") {
          errors.push(`Parse error at row ${err.row}: ${err.message}`);
        }
      }
    }

    if (!result.meta.fields || result.meta.fields.length === 0) {
      return {
        success: false,
        trips: [],
        errors: ["Could not detect column headers"],
        warnings: [],
        stats: { totalRows: 0, totalTrips: 0, totalLoads: 0, bobtailLoads: 0, canceledTrips: 0 },
      };
    }

    const columnMap = mapColumns(result.meta.fields);

    // Check required columns
    if (!columnMap.tripId) {
      return {
        success: false,
        trips: [],
        errors: ["Missing required column: Trip ID"],
        warnings: [],
        stats: { totalRows: 0, totalTrips: 0, totalLoads: 0, bobtailLoads: 0, canceledTrips: 0 },
      };
    }

    totalRows = result.data.length;

    // Normalize excluded addresses to uppercase
    const normalizedExcluded = excludedAddresses.map(a => a.toUpperCase());

    // Process each row (one row = one load)
    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i];
      const rowNum = i + 2; // Account for header row

      const getValue = (field: string): string | number | undefined => {
        const col = columnMap[field];
        return col ? row[col] : undefined;
      };

      const tripId = getValue("tripId")?.toString().trim();
      if (!tripId) {
        warnings.push(`Row ${rowNum}: Missing Trip ID, skipping`);
        continue;
      }

      // Parse load data
      const loadId = getValue("loadId")?.toString().trim() || `LOAD-${rowNum}`;
      const truckFilter = getValue("truckFilter")?.toString() || null;
      const loadIsBobtail = isBobtail(truckFilter);

      if (loadIsBobtail) {
        bobtailLoads++;
      }

      const load: CreateTripLoad = {
        loadId,
        facilitySequence: getValue("facilitySequence")?.toString() || null,
        loadExecutionStatus: getValue("loadExecutionStatus")?.toString() || "Not Started",
        truckFilter,
        isBobtail: loadIsBobtail,
        estimateDistance: parseNumber(getValue("estimateDistance")),
        estimatedCost: loadIsBobtail ? null : parseNumber(getValue("estimatedCost")) || null,
        shipperAccount: getValue("shipperAccount")?.toString() || null,
        stop1: getValue("stop1")?.toString() || null,
        stop1PlannedArr: parseDateTime(
          getValue("stop1PlannedArrivalDate")?.toString(),
          getValue("stop1PlannedArrivalTime")?.toString()
        ),
        stop2: getValue("stop2")?.toString() || null,
        stop2PlannedArr: parseDateTime(
          getValue("stop2PlannedArrivalDate")?.toString(),
          getValue("stop2PlannedArrivalTime")?.toString()
        ),
        stop3: getValue("stop3")?.toString() || null,
        stop3PlannedArr: parseDateTime(
          getValue("stop3PlannedArrivalDate")?.toString(),
          getValue("stop3PlannedArrivalTime")?.toString()
        ),
        stop4: getValue("stop4")?.toString() || null,
        stop4PlannedArr: parseDateTime(
          getValue("stop4PlannedArrivalDate")?.toString(),
          getValue("stop4PlannedArrivalTime")?.toString()
        ),
        stop5: getValue("stop5")?.toString() || null,
        stop5PlannedArr: parseDateTime(
          getValue("stop5PlannedArrivalDate")?.toString(),
          getValue("stop5PlannedArrivalTime")?.toString()
        ),
        stop6: getValue("stop6")?.toString() || null,
        stop6PlannedArr: parseDateTime(
          getValue("stop6PlannedArrivalDate")?.toString(),
          getValue("stop6PlannedArrivalTime")?.toString()
        ),
        stop7: getValue("stop7")?.toString() || null,
        stop7PlannedArr: parseDateTime(
          getValue("stop7PlannedArrivalDate")?.toString(),
          getValue("stop7PlannedArrivalTime")?.toString()
        ),
      };

      // Get or create trip entry
      if (!tripMap.has(tripId)) {
        const tripStage = parseTripStage(getValue("tripStage")?.toString());
        const scheduledDate = load.stop1PlannedArr || new Date();

        tripMap.set(tripId, {
          trip: {
            tripId,
            tripStage,
            equipmentType: getValue("equipmentType")?.toString() || null,
            operatorType: getValue("transitOperatorType")?.toString() || null,
            scheduledDate,
            projectedLoads: 0,
            estimatedAccessorial: 0,
            projectedRevenue: 0,
            loads: [],
          },
          loads: [],
        });
      }

      tripMap.get(tripId)!.loads.push(load);
    }

    // Calculate projections for each trip
    const trips: ImportTrip[] = [];
    let canceledTrips = 0;

    for (const [tripId, { trip, loads }] of tripMap) {
      // Skip cancelled loads for counting
      const activeLoads = loads.filter(l =>
        l.loadExecutionStatus?.toLowerCase() !== "cancelled"
      );

      // Count delivery stops from non-bobtail, non-cancelled loads
      let projectedLoads = 0;
      let estimatedAccessorial = 0;

      for (const load of activeLoads) {
        if (!load.isBobtail) {
          projectedLoads += countDeliveryStops(load, normalizedExcluded);
          estimatedAccessorial += load.estimatedCost || 0;
        }
      }

      // Calculate projected revenue: $452 DTR + accessorial
      const DTR_RATE = 452;
      const projectedRevenue = DTR_RATE + estimatedAccessorial;

      if (trip.tripStage === "CANCELED") {
        canceledTrips++;
      }

      trips.push({
        tripId,
        tripStage: trip.tripStage!,
        equipmentType: trip.equipmentType || null,
        operatorType: trip.operatorType || null,
        scheduledDate: trip.scheduledDate!,
        projectedLoads,
        estimatedAccessorial: estimatedAccessorial || null,
        projectedRevenue: projectedRevenue || null,
        loads,
      });
    }

    // Sort by scheduled date
    trips.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    const totalLoads = Array.from(tripMap.values()).reduce(
      (sum, { loads }) => sum + loads.length,
      0
    );

    return {
      success: errors.length === 0 || trips.length > 0,
      trips,
      errors,
      warnings,
      stats: {
        totalRows,
        totalTrips: trips.length,
        totalLoads,
        bobtailLoads,
        canceledTrips,
      },
    };
  } catch (err) {
    return {
      success: false,
      trips: [],
      errors: [err instanceof Error ? err.message : "Failed to parse trips CSV"],
      warnings: [],
      stats: { totalRows: 0, totalTrips: 0, totalLoads: 0, bobtailLoads: 0, canceledTrips: 0 },
    };
  }
}

// ============================================
// FILE PARSER
// ============================================

export async function parseTripsFile(
  file: File,
  excludedAddresses: string[] = ["MSP7", "MSP8", "MSP9"]
): Promise<TripsParseResult> {
  try {
    const content = await file.text();
    return parseTripsCSV(content, excludedAddresses);
  } catch (err) {
    return {
      success: false,
      trips: [],
      errors: [err instanceof Error ? err.message : "Failed to read file"],
      warnings: [],
      stats: { totalRows: 0, totalTrips: 0, totalLoads: 0, bobtailLoads: 0, canceledTrips: 0 },
    };
  }
}
