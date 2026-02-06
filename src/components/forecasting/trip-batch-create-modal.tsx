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
  useCreateTripBatch,
  useUpdateTripBatch,
  type TripBatchSummary,
} from "@/hooks";

interface TripBatchCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

  const { createBatchAsync, isPending: isCreating } = useCreateTripBatch();
  const { updateBatchAsync, isPending: isUpdating } = useUpdateTripBatch();
  const isPending = isCreating || isUpdating;

  const isEditing = !!editBatch;

  // Reset form state when dialog opens — valid pattern for dialog forms
  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (isEditing) {
        await updateBatchAsync({
          id: editBatch.id,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Batch updated");
      } else {
        await createBatchAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Batch created");
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      // Error toasts handled by the hooks
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
