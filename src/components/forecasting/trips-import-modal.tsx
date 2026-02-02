"use client";

import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Truck,
  ChevronRight,
  MapPin,
  Clock,
  Package,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { parseTripsFile, type TripsParseResult } from "@/lib/parsers/trips-parser";
import { importTrips } from "@/actions/forecasting";
import { toast } from "sonner";
import type { CreateTripLoad } from "@/schema/forecasting.schema";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";

interface TripsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "importing";

interface StopInfo {
  name: string;
  plannedArr: Date | null;
  isDelivery: boolean;
}

function getStops(load: CreateTripLoad): StopInfo[] {
  const stops: StopInfo[] = [];
  const stopData = [
    { name: load.stop1, time: load.stop1PlannedArr },
    { name: load.stop2, time: load.stop2PlannedArr },
    { name: load.stop3, time: load.stop3PlannedArr },
    { name: load.stop4, time: load.stop4PlannedArr },
    { name: load.stop5, time: load.stop5PlannedArr },
    { name: load.stop6, time: load.stop6PlannedArr },
    { name: load.stop7, time: load.stop7PlannedArr },
  ];

  for (const stop of stopData) {
    if (stop.name) {
      const isMSP = stop.name.toUpperCase().startsWith("MSP");
      stops.push({
        name: stop.name,
        plannedArr: stop.time ?? null,
        isDelivery: !isMSP,
      });
    }
  }

  return stops;
}

function countDeliveryStops(load: CreateTripLoad): number {
  if (load.isBobtail) return 0;
  return getStops(load).filter((s) => s.isDelivery).length;
}

/**
 * Filter loads to only show those that introduce NEW delivery stops.
 * This prevents showing duplicate delivery information when a stop appears in multiple loads.
 * For example: if Load A delivers to PY24719, and Load B picks up from PY24719 and returns to MSP,
 * Load B is hidden because PY24719 was already shown in Load A.
 *
 * Loads with more deliveries get priority - they "claim" their stops first.
 */
function filterLoadsWithUniqueDeliveries(loads: CreateTripLoad[]): CreateTripLoad[] {
  // First, filter to only loads with deliveries
  const loadsWithDeliveries = loads.filter((load) => countDeliveryStops(load) > 0);

  // Sort by delivery count descending - loads with more deliveries get priority
  const sortedLoads = [...loadsWithDeliveries].sort(
    (a, b) => countDeliveryStops(b) - countDeliveryStops(a)
  );

  // Build a map of which load first introduces each delivery stop
  const deliveryStopFirstLoad = new Map<string, string>();
  sortedLoads.forEach((load) => {
    getStops(load)
      .filter((s) => s.isDelivery)
      .forEach((stop) => {
        if (!deliveryStopFirstLoad.has(stop.name)) {
          deliveryStopFirstLoad.set(stop.name, load.loadId);
        }
      });
  });

  // Only show loads that first introduce at least one delivery stop
  return sortedLoads.filter((load) => {
    const deliveryStops = getStops(load).filter((s) => s.isDelivery);
    return deliveryStops.some((stop) => deliveryStopFirstLoad.get(stop.name) === load.loadId);
  });
}

export function TripsImportModal({ open, onOpenChange, onSuccess }: TripsImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<TripsParseResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    const result = await parseTripsFile(file);
    setParseResult(result);

    if (result.success && result.trips.length > 0) {
      setStep("preview");
    } else {
      toast.error(result.errors[0] || "Failed to parse file");
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleImport = async () => {
    if (!parseResult?.trips.length) return;

    setStep("importing");
    setImportProgress(0);

    try {
      const result = await importTrips(parseResult.trips);

      if (result.success) {
        const { imported, updated } = result.data!;
        toast.success(`Imported ${imported} trips, updated ${updated} existing trips`);
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || "Failed to import trips");
        setStep("preview");
      }
    } catch {
      toast.error("Failed to import trips");
      setStep("preview");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setParseResult(null);
    setImportProgress(0);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "h:mm a");
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "MMM d");
  };

  // Memoize computed statistics (excluding canceled trips from active counts)
  const stats = useMemo(() => {
    if (!parseResult) return null;

    // Filter out canceled trips for active calculations
    const activeTrips = parseResult.trips.filter((t) => t.tripStage !== "CANCELED");
    const canceledTrips = parseResult.trips.filter((t) => t.tripStage === "CANCELED");

    return {
      // Active trips count (excludes canceled)
      activeTrips: activeTrips.length,
      // Total trips from parser (includes canceled, for import button)
      totalTripsRaw: parseResult.stats.totalTrips,
      // Canceled trips count
      canceledTrips: canceledTrips.length,
      // Projected loads only from active (non-canceled) trips
      projectedLoads: activeTrips.reduce((sum, t) => sum + t.projectedLoads, 0),
      // Projected revenue only from active (non-canceled) trips
      projectedRevenue: activeTrips.reduce((sum, t) => sum + (t.projectedRevenue || 0), 0),
    };
  }, [parseResult]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Trips</DialogTitle>
          <DialogDescription>
            Upload an Amazon Scheduler CSV file
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: .csv, .tsv (tab-delimited)
            </p>
          </div>
        )}

        {step === "preview" && parseResult && stats && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <Alert variant="default" className="border-emerald-200 bg-emerald-50/50 flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">Data Parsed Successfully</AlertTitle>
              <AlertDescription className="text-emerald-700">
                Found {stats.activeTrips} trips with {stats.projectedLoads} projected loads
                {stats.canceledTrips > 0 && (
                  <span className="block text-xs text-emerald-600 mt-1">
                    Note: {stats.canceledTrips} canceled {stats.canceledTrips === 1 ? "trip is" : "trips are"} excluded from trip count and projected loads
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 text-sm flex-shrink-0">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xl font-bold">{stats.activeTrips}</p>
                <p className="text-xs text-muted-foreground">Active Trips</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xl font-bold">{stats.projectedLoads}</p>
                <p className="text-xs text-muted-foreground">Proj. Loads</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xl font-bold text-red-700">{stats.canceledTrips}</p>
                <p className="text-xs text-red-600">Canceled</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex-shrink-0 space-y-2">
              <p className="text-xs text-emerald-700">
                Based on ${FORECASTING_CONSTANTS.DTR_RATE} DTR + ${FORECASTING_CONSTANTS.LOAD_ACCESSORIAL_RATE}/load accessorial
              </p>
              <div className="text-xs text-emerald-800 space-y-1">
                <p>
                  <span className="text-emerald-600">Trip Completed Payout:</span>{" "}
                  {stats.activeTrips} × ${FORECASTING_CONSTANTS.DTR_RATE} ={" "}
                  <span className="font-medium">{formatCurrency(stats.activeTrips * FORECASTING_CONSTANTS.DTR_RATE)}</span>
                </p>
                <p>
                  <span className="text-emerald-600">Projected Loads Accessorial:</span>{" "}
                  {stats.projectedLoads} × ${FORECASTING_CONSTANTS.LOAD_ACCESSORIAL_RATE} ={" "}
                  <span className="font-medium">{formatCurrency(stats.projectedLoads * FORECASTING_CONSTANTS.LOAD_ACCESSORIAL_RATE)}</span>
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-200">
                <p className="text-sm text-emerald-800">
                  <span className="font-medium">Projected Revenue: </span>
                  <span className="font-bold">{formatCurrency(stats.projectedRevenue)}</span>
                </p>
              </div>
            </div>

            {/* Trips Accordion */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <p className="text-sm font-medium mb-2">Trip Details</p>
              <ScrollArea className="h-70 rounded-md border">
                <Accordion type="multiple" className="w-full">
                  {parseResult.trips.map((trip) => {
                    const isCanceled = trip.tripStage === "CANCELED";
                    return (
                      <AccordionItem key={trip.tripId} value={trip.tripId}>
                        <AccordionTrigger className={`px-4 py-2 hover:no-underline ${isCanceled ? "opacity-50" : ""}`}>
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-mono text-sm truncate">{trip.tripId}</span>
                              {isCanceled && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Canceled
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                              <span>{formatDate(trip.scheduledDate)}</span>
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span>{trip.projectedLoads} loads</span>
                              </div>
                              <span className="text-emerald-600 font-medium">
                                Accessorial: {formatCurrency(trip.projectedLoads * FORECASTING_CONSTANTS.LOAD_ACCESSORIAL_RATE)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            {/* Only show loads that introduce NEW delivery stops (deduped) */}
                            {filterLoadsWithUniqueDeliveries(trip.loads).map((load) => (
                              <LoadCard
                                key={load.loadId}
                                load={load}
                                formatTime={formatTime}
                              />
                            ))}
                            {/* Show message if no unique delivery loads */}
                            {filterLoadsWithUniqueDeliveries(trip.loads).length === 0 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No delivery loads (only warehouse movements)
                              </p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>
            </div>

            {parseResult.warnings.length > 0 && (
              <Alert variant="default" className="border-amber-200 bg-amber-50/50 flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Warnings</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <ul className="list-disc list-inside text-xs mt-1">
                    {parseResult.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parseResult.warnings.length > 3 && (
                      <li>...and {parseResult.warnings.length - 3} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport}>
                <Truck className="mr-2 h-4 w-4" />
                Import {stats.totalTripsRaw} Trips
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Importing trips...</p>
            {importProgress > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {importProgress}% complete
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Separate component for load card to optimize rendering
interface LoadCardProps {
  load: CreateTripLoad;
  formatTime: (date: Date | null) => string;
}

function LoadCard({ load, formatTime }: LoadCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const stops = useMemo(() => getStops(load), [load]);
  const deliveryCount = useMemo(() => countDeliveryStops(load), [load]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${load.isBobtail ? "bg-amber-50/50 border-amber-200" : "bg-muted/30"}`}>
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {load.isBobtail ? (
                <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                  Bobtail
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">
                  Delivery
                </Badge>
              )}
              <span className="font-mono text-xs">{load.loadId}</span>
            </div>
            {load.facilitySequence && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {load.facilitySequence}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {stops.length} stops
              {!load.isBobtail && ` • ${deliveryCount} deliveries`}
            </span>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1">
            <div className="space-y-1.5">
              {stops.map((stop, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-xs p-2 rounded ${
                    stop.isDelivery
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <MapPin className={`h-3 w-3 flex-shrink-0 ${stop.isDelivery ? "text-emerald-600" : "text-slate-500"}`} />
                    <span className={`font-mono truncate ${stop.isDelivery ? "text-emerald-800 font-medium" : "text-slate-600"}`}>
                      {stop.name}
                    </span>
                    {!stop.isDelivery && (
                      <span className="text-[10px] text-slate-400">(Warehouse)</span>
                    )}
                  </div>
                  {stop.plannedArr && (
                    <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(stop.plannedArr)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {deliveryCount > 0 && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Accessorial: <span className="font-medium text-emerald-600">
                  {deliveryCount} × ${FORECASTING_CONSTANTS.LOAD_ACCESSORIAL_RATE} = ${(deliveryCount * FORECASTING_CONSTANTS.LOAD_ACCESSORIAL_RATE).toFixed(2)}
                </span>
                {load.estimateDistance > 0 && (
                  <span className="ml-3">Distance: {load.estimateDistance.toFixed(1)} mi</span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
