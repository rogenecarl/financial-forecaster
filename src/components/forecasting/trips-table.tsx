"use client";

import { useState, useMemo, Fragment, useCallback } from "react";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MessageSquare,
  Loader2,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripWithLoadsForTable } from "@/actions/forecasting/trips";
import { updateTrip } from "@/actions/forecasting";
import { toast } from "sonner";
import { FORECASTING_CONSTANTS } from "@/config/forecasting";

interface TripsTableProps {
  trips: TripWithLoadsForTable[];
  loading?: boolean;
  onUpdate: () => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

interface StopInfo {
  name: string;
  plannedArr: Date | null;
  isDelivery: boolean;
}

interface LoadType {
  id: string;
  loadId: string;
  facilitySequence: string | null;
  loadExecutionStatus: string;
  isBobtail: boolean;
  estimateDistance: number;
  estimatedCost: number | null;
  stop1: string | null;
  stop1PlannedArr: Date | null;
  stop2: string | null;
  stop2PlannedArr: Date | null;
  stop3: string | null;
  stop3PlannedArr: Date | null;
  stop4: string | null;
  stop4PlannedArr: Date | null;
  stop5: string | null;
  stop5PlannedArr: Date | null;
  stop6: string | null;
  stop6PlannedArr: Date | null;
  stop7: string | null;
  stop7PlannedArr: Date | null;
}

function getStops(load: LoadType): StopInfo[] {
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

function countDeliveryStops(load: LoadType): number {
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
function filterLoadsWithUniqueDeliveries(loads: LoadType[]): LoadType[] {
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

export function TripsTable({ trips, loading, onUpdate, selectedIds, onSelectionChange }: TripsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [notesTrip, setNotesTrip] = useState<TripWithLoadsForTable | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === trips.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(trips.map((t) => t.id));
    }
  }, [selectedIds, trips, onSelectionChange]);

  const handleSelect = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((i) => i !== id));
      }
    },
    [selectedIds, onSelectionChange]
  );

  const toggleTrip = (tripId: string) => {
    setExpandedTrips((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  const handleStartEdit = (trip: TripWithLoadsForTable) => {
    setEditingId(trip.id);
    setEditValue(trip.actualLoads?.toString() || "");
  };

  const handleSaveEdit = async (trip: TripWithLoadsForTable) => {
    const value = editValue.trim();
    const actualLoads = value === "" ? null : parseInt(value, 10);

    if (value !== "" && (isNaN(actualLoads!) || actualLoads! < 0)) {
      toast.error("Please enter a valid number");
      return;
    }

    setSaving(true);
    try {
      const result = await updateTrip({
        id: trip.id,
        actualLoads,
      });

      if (result.success) {
        toast.success("Updated actual loads");
        onUpdate();
      } else {
        toast.error(result.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, trip: TripWithLoadsForTable) => {
    if (e.key === "Enter") {
      handleSaveEdit(trip);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const handleOpenNotes = (trip: TripWithLoadsForTable) => {
    setNotesTrip(trip);
    setNotesValue(trip.notes || "");
  };

  const handleSaveNotes = async () => {
    if (!notesTrip) return;

    setSaving(true);
    try {
      const result = await updateTrip({
        id: notesTrip.id,
        notes: notesValue || null,
      });

      if (result.success) {
        toast.success("Notes saved");
        setNotesTrip(null);
        onUpdate();
      } else {
        toast.error(result.error || "Failed to save notes");
      }
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (trip: TripWithLoadsForTable) => {
    if (trip.tripStage === "CANCELED") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (trip.actualLoads !== null) {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
    if (new Date(trip.scheduledDate) < new Date()) {
      return <Clock className="h-4 w-4 text-amber-500" />;
    }
    return <Truck className="h-4 w-4 text-blue-500" />;
  };

  const getStatusText = (trip: TripWithLoadsForTable) => {
    if (trip.tripStage === "CANCELED") return "Canceled";
    if (trip.actualLoads !== null) return "Updated";
    if (new Date(trip.scheduledDate) < new Date()) return "Pending/Rejected";
    return "Scheduled";
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "h:mm a");
  };

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Trip ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Projected</TableHead>
              <TableHead className="text-center">Actual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projected Rev.</TableHead>
              <TableHead className="text-right">Actual Rev.</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <Truck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No trips for this period</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    trips.length > 0 &&
                    selectedIds.length === trips.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Trip ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Projected</TableHead>
              <TableHead className="text-center">Actual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projected Rev.</TableHead>
              <TableHead className="text-right">Actual Rev.</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => {
              const isExpanded = expandedTrips.has(trip.id);
              const hasLoads = trip.loads && trip.loads.length > 0;
              const isCanceled = trip.tripStage === "CANCELED";
              const isSelected = selectedIds.includes(trip.id);

              return (
                <Fragment key={trip.id}>
                  <TableRow
                    className={`${isCanceled ? "opacity-50" : ""} ${hasLoads ? "cursor-pointer hover:bg-muted/50" : ""} ${isSelected ? "bg-blue-50" : ""}`}
                    onClick={() => hasLoads && toggleTrip(trip.id)}
                  >
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelect(trip.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[40px]">
                      {hasLoads && (
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {trip.tripId}
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.scheduledDate), "MMM d")}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {trip.projectedLoads}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      {editingId === trip.id ? (
                        <div className="flex items-center justify-center">
                          <Input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, trip)}
                            onBlur={() => handleSaveEdit(trip)}
                            className="w-16 h-8 text-center"
                            autoFocus
                            disabled={saving}
                          />
                          {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(trip);
                          }}
                          className="w-16 h-8 border rounded px-2 text-center hover:bg-muted/50 transition-colors"
                          disabled={isCanceled}
                        >
                          {trip.actualLoads ?? "-"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(trip)}
                        <span className="text-sm">{getStatusText(trip)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground">
                          ${FORECASTING_CONSTANTS.TRIP_ACCESSORIAL_RATE} + ${FORECASTING_CONSTANTS.DTR_RATE.toFixed(2)}
                        </div>
                        <div className="font-medium text-emerald-700 tabular-nums">
                          ${(FORECASTING_CONSTANTS.TRIP_ACCESSORIAL_RATE + FORECASTING_CONSTANTS.DTR_RATE).toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {trip.actualLoads !== null && trip.actualRevenue !== null ? (
                        <span className="text-emerald-600 font-medium">
                          {formatCurrency(trip.actualRevenue)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(() => {
                        const projectedRev = FORECASTING_CONSTANTS.TRIP_ACCESSORIAL_RATE + FORECASTING_CONSTANTS.DTR_RATE;

                        // Canceled trip with actual revenue = TONU
                        if (isCanceled && trip.actualRevenue !== null && trip.actualRevenue > 0) {
                          return (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                              TONU
                            </Badge>
                          );
                        }

                        // No actual loads entered yet - don't calculate variance
                        if (trip.actualLoads === null) {
                          return <span className="text-muted-foreground">-</span>;
                        }

                        // Calculate variance
                        const variance = (trip.actualRevenue ?? 0) - projectedRev;
                        const isPositive = variance >= 0;

                        return (
                          <span className={isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            {isPositive ? "+" : ""}{formatCurrency(variance)}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenNotes(trip)}
                            >
                              <MessageSquare
                                className={`h-4 w-4 ${trip.notes ? "text-blue-500" : "text-muted-foreground"}`}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {trip.notes ? "View/Edit Notes" : "Add Notes"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>

                  {/* Expanded loads section */}
                  {isExpanded && hasLoads && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={11} className="p-0">
                        <div className="px-6 py-4 space-y-3">
                          {filterLoadsWithUniqueDeliveries(trip.loads).map((load) => (
                            <LoadCard
                              key={load.id}
                              load={load}
                              formatTime={formatTime}
                            />
                          ))}
                          {filterLoadsWithUniqueDeliveries(trip.loads).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No delivery loads (only warehouse movements)
                            </p>
                          )}

                          {/* Revenue Summary */}
                          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between text-emerald-700">
                                <span>Trip Accessorial:</span>
                                <span>${FORECASTING_CONSTANTS.TRIP_ACCESSORIAL_RATE.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-emerald-700">
                                <span>DTR:</span>
                                <span>${FORECASTING_CONSTANTS.DTR_RATE.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-emerald-200 font-medium text-emerald-800">
                                <span>Projected Revenue:</span>
                                <span>${(FORECASTING_CONSTANTS.TRIP_ACCESSORIAL_RATE + FORECASTING_CONSTANTS.DTR_RATE).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Notes Dialog */}
      <Dialog open={!!notesTrip} onOpenChange={() => setNotesTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip Notes</DialogTitle>
            <DialogDescription>
              {notesTrip?.tripId} - {notesTrip && format(new Date(notesTrip.scheduledDate), "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add notes about this trip..."
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesTrip(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Load card component
interface LoadCardProps {
  load: LoadType;
  formatTime: (date: Date | null) => string;
}

function LoadCard({ load, formatTime }: LoadCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const stops = useMemo(() => getStops(load), [load]);
  const deliveryCount = useMemo(() => countDeliveryStops(load), [load]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${load.isBobtail ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"}`}>
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/30 rounded-lg transition-colors">
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
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
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
          <div className="px-3 pb-3 pt-1 border-t">
            <div className="space-y-1.5 mt-2">
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
            {(deliveryCount > 0 || load.estimateDistance > 0) && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                {deliveryCount > 0 && (
                  <span className="font-medium text-emerald-600">
                    {deliveryCount} {deliveryCount === 1 ? "delivery" : "deliveries"}
                  </span>
                )}
                {load.estimateDistance > 0 && (
                  <span className={deliveryCount > 0 ? "ml-3" : ""}>Distance: {load.estimateDistance.toFixed(1)} mi</span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
