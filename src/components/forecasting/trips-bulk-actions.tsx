"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TripsBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting?: boolean;
}

export function TripsBulkActions({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  isDeleting = false,
}: TripsBulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      {/* Floating action bar with frosted glass */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "bg-slate-900/95 backdrop-blur-lg text-white rounded-xl shadow-2xl shadow-black/20",
          "flex items-center gap-3 px-5 py-3",
          "ring-1 ring-white/10",
          "animate-in fade-in slide-in-from-bottom-4 duration-200"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-[11px] font-bold tabular-nums">
            {selectedCount}
          </div>
          <span className="text-sm font-medium">
            {selectedCount === 1 ? "trip" : "trips"} selected
          </span>
        </div>

        <div className="h-5 w-px bg-white/20" />

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-white/10 hover:text-red-300"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>

        <div className="h-5 w-px bg-white/20" />

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-400 hover:bg-white/10 hover:text-white h-7 w-7 p-0"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Trips?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected trips and their
              associated loads will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedCount} Trips
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
