"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Circle,
  Activity,
  CheckCircle2,
} from "lucide-react";
import type { TransactionBatchStatus } from "@/lib/generated/prisma/client";

interface TransactionBatchStatusBadgeProps {
  status: TransactionBatchStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig: Record<
  TransactionBatchStatus,
  {
    label: string;
    icon: typeof Circle;
    className: string;
  }
> = {
  EMPTY: {
    label: "Empty",
    icon: Circle,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  ACTIVE: {
    label: "Active",
    icon: Activity,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  RECONCILED: {
    label: "Reconciled",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const sizeConfig = {
  sm: {
    badge: "text-[10px] px-1.5 py-0.5",
    icon: "h-3 w-3",
  },
  md: {
    badge: "text-xs px-2 py-0.5",
    icon: "h-3.5 w-3.5",
  },
  lg: {
    badge: "text-sm px-2.5 py-1",
    icon: "h-4 w-4",
  },
};

export function TransactionBatchStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: TransactionBatchStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium gap-1 border",
        config.className,
        sizes.badge
      )}
    >
      {showIcon && <Icon className={sizes.icon} />}
      {config.label}
    </Badge>
  );
}
