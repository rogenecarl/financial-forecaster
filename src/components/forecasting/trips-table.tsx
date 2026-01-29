"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, Truck, XCircle, MessageSquare, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripSummary } from "@/actions/forecasting/trips";
import { updateTrip } from "@/actions/forecasting";
import { toast } from "sonner";

interface TripsTableProps {
  trips: TripSummary[];
  loading?: boolean;
  onUpdate: () => void;
}

export function TripsTable({ trips, loading, onUpdate }: TripsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [notesTrip, setNotesTrip] = useState<TripSummary | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const handleStartEdit = (trip: TripSummary) => {
    setEditingId(trip.id);
    setEditValue(trip.actualLoads?.toString() || "");
  };

  const handleSaveEdit = async (trip: TripSummary) => {
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

  const handleKeyDown = (e: React.KeyboardEvent, trip: TripSummary) => {
    if (e.key === "Enter") {
      handleSaveEdit(trip);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const handleOpenNotes = (trip: TripSummary) => {
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

  const getStatusIcon = (trip: TripSummary) => {
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

  const getStatusText = (trip: TripSummary) => {
    if (trip.tripStage === "CANCELED") return "Canceled";
    if (trip.actualLoads !== null) return "Updated";
    if (new Date(trip.scheduledDate) < new Date()) return "Pending";
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

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Projected</TableHead>
              <TableHead className="text-center">Actual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
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
        <p className="text-sm text-muted-foreground">No trips for this week</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Projected</TableHead>
              <TableHead className="text-center">Actual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow
                key={trip.id}
                className={trip.tripStage === "CANCELED" ? "opacity-50" : ""}
              >
                <TableCell className="font-mono text-sm">{trip.tripId}</TableCell>
                <TableCell>
                  {format(new Date(trip.scheduledDate), "MMM d")}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {trip.projectedLoads}
                </TableCell>
                <TableCell className="text-center">
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
                      onClick={() => handleStartEdit(trip)}
                      className="w-16 h-8 border rounded px-2 text-center hover:bg-muted/50 transition-colors"
                      disabled={trip.tripStage === "CANCELED"}
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
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(trip.projectedRevenue)}
                </TableCell>
                <TableCell>
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
            ))}
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
