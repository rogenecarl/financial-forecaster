"use client";

import { useState, useMemo, Fragment } from "react";
import { format } from "date-fns";
import {
  ChevronRight,
  Truck,
  AlertTriangle,
  Clock,
  MapPin,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AmazonInvoiceLineItem } from "@/schema/forecasting.schema";

interface InvoiceDetailsTableProps {
  lineItems: AmazonInvoiceLineItem[];
  loading?: boolean;
}

interface TourGroup {
  tripId: string;
  tour: AmazonInvoiceLineItem | null;
  loads: AmazonInvoiceLineItem[];
  adjustments: AmazonInvoiceLineItem[];
  totalGrossPay: number;
  totalDistance: number;
  totalFuelSurcharge: number;
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
}

function groupByTripId(lineItems: AmazonInvoiceLineItem[]): TourGroup[] {
  const groups = new Map<string, TourGroup>();

  for (const item of lineItems) {
    const tripId = item.tripId;

    if (!groups.has(tripId)) {
      groups.set(tripId, {
        tripId,
        tour: null,
        loads: [],
        adjustments: [],
        totalGrossPay: 0,
        totalDistance: 0,
        totalFuelSurcharge: 0,
        dateRangeStart: null,
        dateRangeEnd: null,
      });
    }

    const group = groups.get(tripId)!;
    group.totalGrossPay += item.grossPay;
    group.totalDistance += item.distanceMiles;
    group.totalFuelSurcharge += item.fuelSurcharge;

    // Track date range from all items (loads have dates, tours may not)
    if (item.startDate) {
      const startTime = new Date(item.startDate).getTime();
      if (!group.dateRangeStart || startTime < new Date(group.dateRangeStart).getTime()) {
        group.dateRangeStart = item.startDate;
      }
    }
    if (item.endDate) {
      const endTime = new Date(item.endDate).getTime();
      if (!group.dateRangeEnd || endTime > new Date(group.dateRangeEnd).getTime()) {
        group.dateRangeEnd = item.endDate;
      }
    }

    if (item.itemType === "TOUR_COMPLETED") {
      group.tour = item;
    } else if (item.itemType === "LOAD_COMPLETED") {
      group.loads.push(item);
    } else {
      group.adjustments.push(item);
    }
  }

  // Sort loads by start date within each group
  for (const group of groups.values()) {
    group.loads.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });
  }

  // Sort groups by date range start (calculated from loads) or by tripId
  return Array.from(groups.values()).sort((a, b) => {
    const dateA = a.dateRangeStart ? new Date(a.dateRangeStart).getTime() : 0;
    const dateB = b.dateRangeStart ? new Date(b.dateRangeStart).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return a.tripId.localeCompare(b.tripId);
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return format(new Date(date), "MMM d");
}

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return "-";
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  const startStr = format(new Date(start), "MMM d");
  const endStr = format(new Date(end), "MMM d");
  if (startStr === endStr) return startStr;
  return `${startStr} - ${endStr}`;
}

export function InvoiceDetailsTable({ lineItems, loading }: InvoiceDetailsTableProps) {
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());

  const tourGroups = useMemo(() => groupByTripId(lineItems), [lineItems]);

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

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Trip ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Loads</TableHead>
              <TableHead className="text-right">Base Rate</TableHead>
              <TableHead className="text-right">Fuel Sur.</TableHead>
              <TableHead className="text-right">Total Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tourGroups.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <Truck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No line items found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Trip ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Loads</TableHead>
            <TableHead className="text-right">Base Rate</TableHead>
            <TableHead className="text-right">Fuel Sur.</TableHead>
            <TableHead className="text-right">Total Pay</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tourGroups.map((group) => {
            const isExpanded = expandedTrips.has(group.tripId);
            const hasDetails = group.loads.length > 0 || group.adjustments.length > 0;
            const isAdjustmentOnly = !group.tour && group.adjustments.length > 0;

            return (
              <Fragment key={group.tripId}>
                <TableRow
                  className={`${hasDetails ? "cursor-pointer hover:bg-muted/50" : ""} ${isAdjustmentOnly ? "bg-amber-50/50" : ""}`}
                  onClick={() => hasDetails && toggleTrip(group.tripId)}
                >
                  <TableCell className="w-[40px]">
                    {hasDetails && (
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {group.tripId}
                      {group.loads.length > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {group.loads.length} {group.loads.length === 1 ? "load" : "loads"}
                        </Badge>
                      )}
                      {group.adjustments.length > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-100 text-amber-700 border-amber-300">
                          {group.adjustments.length} adj
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDateRange(group.dateRangeStart, group.dateRangeEnd)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {group.loads.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.tour && group.tour.baseRate > 0
                      ? formatCurrency(group.tour.baseRate)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.totalFuelSurcharge > 0
                      ? formatCurrency(group.totalFuelSurcharge)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-emerald-600">
                    {formatCurrency(group.totalGrossPay)}
                  </TableCell>
                </TableRow>

                {/* Expanded details section */}
                {isExpanded && hasDetails && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={7} className="p-0">
                      <div className="px-6 py-4 space-y-3">
                        {/* Tour Details Card */}
                        {group.tour && (
                          <TourDetailCard tour={group.tour} />
                        )}

                        {/* Load Cards */}
                        {group.loads.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Loads ({group.loads.length})
                            </div>
                            {group.loads.map((load) => (
                              <LoadDetailCard key={load.id} load={load} />
                            ))}
                          </div>
                        )}

                        {/* Adjustment Cards */}
                        {group.adjustments.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Adjustments ({group.adjustments.length})
                            </div>
                            {group.adjustments.map((adj) => (
                              <AdjustmentDetailCard key={adj.id} adjustment={adj} />
                            ))}
                          </div>
                        )}
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
  );
}

// Tour Detail Card
interface TourDetailCardProps {
  tour: AmazonInvoiceLineItem;
}

function TourDetailCard({ tour }: TourDetailCardProps) {
  return (
    <div className="rounded-lg border bg-blue-50/50 border-blue-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">
            Tour
          </Badge>
          {tour.operator && (
            <span className="text-xs font-medium">{tour.operator}</span>
          )}
        </div>
        <span className="font-medium text-xs text-blue-700">
          {formatCurrency(tour.grossPay)}
        </span>
      </div>
      {/* Tour details row */}
      <div className="flex items-center gap-4 mt-2 text-xs">
        {tour.durationHours > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{tour.durationHours.toFixed(2)} hrs</span>
          </div>
        )}
        {tour.baseRate > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Base:</span>
            <span className="font-medium">{formatCurrency(tour.baseRate)}</span>
          </div>
        )}
      </div>
      {tour.comments && (
        <p className="mt-2 text-xs text-muted-foreground">{tour.comments}</p>
      )}
    </div>
  );
}

// Load Detail Card with Collapsible
interface LoadDetailCardProps {
  load: AmazonInvoiceLineItem;
}

function LoadDetailCard({ load }: LoadDetailCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-white border-slate-200">
        <CollapsibleTrigger className="w-full p-3 hover:bg-muted/30 rounded-lg transition-colors">
          <div className="flex items-center justify-between">
            {/* Left side - Load ID and Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                Load
              </Badge>
              <span className="font-mono text-xs font-medium">{load.loadId || "-"}</span>
            </div>
            {/* Right side - Gross Pay and Chevron */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-emerald-600">
                {formatCurrency(load.grossPay)}
              </span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </div>
          </div>
          {/* Details row - Start Date, End Date, Distance */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium">{formatDate(load.startDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">{formatDate(load.endDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{load.distanceMiles.toFixed(1)} mi</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-muted-foreground">Base Rate</p>
                <p className="font-medium">{formatCurrency(load.baseRate)}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-muted-foreground">Fuel Surcharge</p>
                <p className="font-medium">{formatCurrency(load.fuelSurcharge)}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-muted-foreground">Detention</p>
                <p className="font-medium">{formatCurrency(load.detention)}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-muted-foreground">TONU</p>
                <p className="font-medium">{formatCurrency(load.tonu)}</p>
              </div>
            </div>
            {load.comments && (
              <p className="mt-2 text-xs text-muted-foreground">{load.comments}</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Adjustment Detail Card
interface AdjustmentDetailCardProps {
  adjustment: AmazonInvoiceLineItem;
}

function AdjustmentDetailCard({ adjustment }: AdjustmentDetailCardProps) {
  return (
    <div className="rounded-lg border bg-amber-50/50 border-amber-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {adjustment.itemType === "ADJUSTMENT_DISPUTE" ? "Dispute" : "Adjustment"}
          </Badge>
          {adjustment.tonu > 0 && (
            <span className="text-xs text-muted-foreground">
              TONU: {formatCurrency(adjustment.tonu)}
            </span>
          )}
        </div>
        <span className={`text-xs font-medium ${adjustment.grossPay >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {formatCurrency(adjustment.grossPay)}
        </span>
      </div>
      {adjustment.comments && (
        <p className="mt-2 text-xs text-muted-foreground">{adjustment.comments}</p>
      )}
    </div>
  );
}
