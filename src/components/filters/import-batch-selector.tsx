"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Check, ChevronDown, FileText, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";
import type { ImportBatchOption } from "@/actions/filters";

interface ImportBatchSelectorProps {
  batches: ImportBatchOption[];
  selectedBatchId: string | null;
  onBatchChange: (batchId: string | null) => void;
  loading?: boolean;
  className?: string;
}

export function ImportBatchSelector({
  batches,
  selectedBatchId,
  onBatchChange,
  loading = false,
  className,
}: ImportBatchSelectorProps) {
  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  const displayLabel = useMemo(() => {
    if (selectedBatchId === null) return "All Imports";
    if (selectedBatch) {
      return `${format(new Date(selectedBatch.importedAt), "MMM d")} (${selectedBatch.newTripsCount} trips)`;
    }
    return "Select Import";
  }, [selectedBatchId, selectedBatch]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-w-[180px]", className)}
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px] max-h-[400px] overflow-y-auto">
        <DropdownMenuItem
          onClick={() => onBatchChange(null)}
          className="flex items-center gap-2"
        >
          {selectedBatchId === null && <Check className="h-4 w-4" />}
          {selectedBatchId !== null && <span className="w-4" />}
          <span>All Imports</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {batches.length > 0 && (
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Import History
          </DropdownMenuLabel>
        )}

        {batches.map((batch) => (
          <DropdownMenuItem
            key={batch.id}
            onClick={() => onBatchChange(batch.id)}
            className="flex items-center gap-2"
          >
            {selectedBatchId === batch.id && <Check className="h-4 w-4 flex-shrink-0" />}
            {selectedBatchId !== batch.id && <span className="w-4 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {format(new Date(batch.importedAt), "MMM d, h:mm a")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {batch.newTripsCount} trips
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[140px] flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {batch.fileName}
                </span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(batch.projectedTotal)}
                </span>
              </div>
              {batch.skippedCount > 0 && (
                <div className="text-xs text-amber-600">
                  {batch.skippedCount} skipped
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {batches.length === 0 && !loading && (
          <DropdownMenuItem disabled className="text-muted-foreground justify-center">
            No imports yet
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
