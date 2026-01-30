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

  // Memoize computed statistics
  const stats = useMemo(() => {
    if (!parseResult) return null;
    return {
      totalTrips: parseResult.stats.totalTrips,
      totalLoads: parseResult.stats.totalLoads,
      bobtailLoads: parseResult.stats.bobtailLoads,
      canceledTrips: parseResult.stats.canceledTrips,
      projectedLoads: parseResult.trips.reduce((sum, t) => sum + t.projectedLoads, 0),
      projectedRevenue: parseResult.trips.reduce((sum, t) => sum + (t.projectedRevenue || 0), 0),
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
                Found {stats.totalTrips} trips with {stats.projectedLoads} projected loads
              </AlertDescription>
            </Alert>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 text-sm flex-shrink-0">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xl font-bold">{stats.totalTrips}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xl font-bold">{stats.projectedLoads}</p>
                <p className="text-xs text-muted-foreground">Proj. Loads</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <p className="text-xl font-bold text-amber-700">{stats.bobtailLoads}</p>
                <p className="text-xs text-amber-600">Bobtail</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xl font-bold text-red-700">{stats.canceledTrips}</p>
                <p className="text-xs text-red-600">Canceled</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex-shrink-0">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">Projected Revenue: </span>
                {formatCurrency(stats.projectedRevenue)}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Based on $452 DTR + estimated accessorials
              </p>
            </div>

            {/* Trips Accordion */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <p className="text-sm font-medium mb-2">Trip Details</p>
              <ScrollArea className="h-[280px] rounded-md border">
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
                                {formatCurrency(trip.projectedRevenue || 0)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            {trip.loads.map((load) => (
                              <LoadCard
                                key={load.loadId}
                                load={load}
                                formatTime={formatTime}
                              />
                            ))}
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
                Import {stats.totalTrips} Trips
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
            {load.estimatedCost != null && load.estimatedCost > 0 && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                Accessorial: <span className="font-medium text-emerald-600">${load.estimatedCost.toFixed(2)}</span>
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
