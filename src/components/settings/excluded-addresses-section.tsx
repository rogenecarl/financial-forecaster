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
import { Plus, X, Loader2 } from "lucide-react";
import {
  getUserSettings,
  addExcludedAddress,
  removeExcludedAddress,
} from "@/actions/settings";

export function ExcludedAddressesSection() {
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

  const addresses = settingsResult?.success ? settingsResult.data.excludedAddresses : [];

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Excluded Addresses
        </CardTitle>
        <CardDescription>
          Addresses excluded when counting loads (e.g., origin stations)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-lg border bg-muted/30">
          {addresses.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              No excluded addresses. Add stations like MSP7, MSP8, etc.
            </span>
          ) : (
            addresses.map((address) => (
              <Badge
                key={address}
                variant="secondary"
                className="gap-1 pr-1 font-mono"
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

        <div className="flex gap-2">
          <Input
            placeholder="Enter address (e.g., MSP7)"
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

        <p className="text-xs text-muted-foreground">
          These addresses (typically Amazon stations) will be excluded when
          counting delivery stops for load projections.
        </p>
      </CardContent>
    </Card>
  );
}
