"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, Loader2, Info } from "lucide-react";
import {
  getUserSettings,
  addExcludedAddress,
  removeExcludedAddress,
} from "@/actions/settings";

export function LoadCountingSection() {
  const queryClient = useQueryClient();
  const [newAddress, setNewAddress] = useState("");

  const { data: settingsResult, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const addMutation = useMutation({
    mutationFn: (address: string) => addExcludedAddress(address),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Address added");
        setNewAddress("");
        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      } else {
        toast.error(result.error || "Failed to add address");
      }
    },
    onError: () => {
      toast.error("Failed to add address");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (address: string) => removeExcludedAddress(address),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Address removed");
        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      } else {
        toast.error(result.error || "Failed to remove address");
      }
    },
    onError: () => {
      toast.error("Failed to remove address");
    },
  });

  const addresses = settingsResult?.success
    ? settingsResult.data.excludedAddresses
    : [];

  const handleAdd = () => {
    const trimmed = newAddress.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter an address");
      return;
    }
    if (trimmed.length > 20) {
      toast.error("Address must be 20 characters or less");
      return;
    }
    addMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Excluded Station Addresses
          </CardTitle>
          <CardDescription>
            These addresses are excluded when counting loads from the Trips CSV.
            Stops at these locations are Amazon stations, not delivery addresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current addresses display */}
          <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-lg border bg-muted/30">
            {addresses.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                No excluded addresses. Add stations like MSP7, MSP8, etc.
              </span>
            ) : (
              addresses.map((address) => (
                <Badge
                  key={address}
                  variant="secondary"
                  className="gap-1 pr-1 font-mono text-sm"
                >
                  {address}
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(address)}
                    disabled={removeMutation.isPending}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    {removeMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </Badge>
              ))
            )}
          </div>

          {/* Add new address */}
          <div className="flex gap-2">
            <Input
              placeholder="Add station address..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="flex-1 font-mono uppercase"
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={addMutation.isPending || !newAddress.trim()}
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Load Counting Rules Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                Load Counting Rules
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Stop 1 is always excluded (starting station)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Bobtail loads are automatically excluded</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Only stops 2-7 at non-station addresses are counted</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
