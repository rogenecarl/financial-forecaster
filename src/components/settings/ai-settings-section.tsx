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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles } from "lucide-react";
import { getUserSettings, updateAISettings } from "@/actions/settings";

export function AISettingsSection() {
  const queryClient = useQueryClient();
  // Local state for optimistic UI updates during slider drag
  const [localThreshold, setLocalThreshold] = useState<number | null>(null);

  const { data: settingsResult, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const settings = settingsResult?.success ? settingsResult.data : null;
  const enabled = settings?.aiCategorizationEnabled ?? true;
  const threshold = localThreshold ?? settings?.aiConfidenceThreshold ?? 0.8;

  const mutation = useMutation({
    mutationFn: ({ enabled, threshold }: { enabled: boolean; threshold: number }) =>
      updateAISettings(enabled, threshold),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("AI settings saved");
        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
        setLocalThreshold(null); // Reset local state after successful save
      } else {
        toast.error(result.error || "Failed to save AI settings");
      }
    },
    onError: () => {
      toast.error("Failed to save AI settings");
    },
  });

  const handleEnabledChange = (newEnabled: boolean) => {
    mutation.mutate({ enabled: newEnabled, threshold });
  };

  const handleThresholdChange = (value: number[]) => {
    setLocalThreshold(value[0]);
  };

  const handleThresholdCommit = (value: number[]) => {
    mutation.mutate({ enabled, threshold: value[0] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-500" />
          AI Categorization
        </CardTitle>
        <CardDescription>
          Configure AI-powered transaction categorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="ai-enabled" className="text-sm font-medium">
              Enable AI Auto-Categorization
            </Label>
            <p className="text-xs text-muted-foreground">
              Use AI to automatically categorize imported transactions
            </p>
          </div>
          <Switch
            id="ai-enabled"
            checked={enabled}
            onCheckedChange={handleEnabledChange}
            disabled={mutation.isPending}
          />
        </div>

        <div
          className={`space-y-4 transition-opacity ${
            !enabled ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Confidence Threshold</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {Math.round(threshold * 100)}%
              </span>
            </div>
            <Slider
              value={[threshold]}
              min={0.5}
              max={1}
              step={0.05}
              onValueChange={handleThresholdChange}
              onValueCommit={handleThresholdCommit}
              disabled={!enabled || mutation.isPending}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% (More auto-categorized)</span>
              <span>100% (Manual review)</span>
            </div>
          </div>

          <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  How it works
                </p>
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  When you import transactions, AI will analyze each one and suggest
                  a category. Transactions with confidence above{" "}
                  <strong>{Math.round(threshold * 100)}%</strong> will be automatically
                  categorized. Lower confidence transactions will be flagged for
                  manual review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
