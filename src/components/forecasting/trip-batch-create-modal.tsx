"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createTripBatch,
  updateTripBatch,
  type TripBatchSummary,
} from "@/actions/forecasting/trip-batches";

interface TripBatchCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (batch: TripBatchSummary) => void;
  editBatch?: TripBatchSummary | null;
}

export function TripBatchCreateModal({
  open,
  onOpenChange,
  onSuccess,
  editBatch,
}: TripBatchCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = !!editBatch;

  // Reset form when modal opens/closes or editBatch changes
  useEffect(() => {
    if (open) {
      if (editBatch) {
        setName(editBatch.name);
        setDescription(editBatch.description || "");
      } else {
        setName("");
        setDescription("");
      }
    }
  }, [open, editBatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      let result;
      if (isEditing) {
        result = await updateTripBatch({
          id: editBatch.id,
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        result = await createTripBatch({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }

      if (result.success && result.data) {
        toast.success(isEditing ? "Batch updated" : "Batch created");
        onSuccess(result.data);
        onOpenChange(false);
      } else if (!result.success) {
        toast.error(result.error || "Failed to save batch");
      }
    } catch {
      toast.error("Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Batch" : "Create New Batch"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the batch name and description."
                : "Create a new batch to organize your trips and invoices."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Week 7 - Feb 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Regular weekly deliveries for Zone A"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
