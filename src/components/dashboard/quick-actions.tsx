"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Receipt, BarChart3, LineChart } from "lucide-react";

const quickActions = [
  {
    title: "New Trip Batch",
    description: "Create & import trips",
    icon: Truck,
    href: "/trips",
  },
  {
    title: "New Transaction Batch",
    description: "Import bank statement",
    icon: Receipt,
    href: "/transactions",
  },
  {
    title: "Run Forecast",
    description: "Predict weekly revenue",
    icon: LineChart,
    href: "/forecasting",
  },
  {
    title: "View Analytics",
    description: "Charts & insights",
    icon: BarChart3,
    href: "/trips",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              asChild
            >
              <Link href={action.href}>
                <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
