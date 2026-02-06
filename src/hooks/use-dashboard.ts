"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData, type DashboardData } from "@/actions/dashboard/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
};

export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: async () => {
      const result = await getDashboardData();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60_000,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export type { DashboardData };
