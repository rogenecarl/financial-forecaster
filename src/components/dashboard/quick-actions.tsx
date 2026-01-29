"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Truck, BarChart3 } from "lucide-react";

const quickActions = [
  {
    title: "Import Transactions",
    description: "Upload bank statement CSV",
    icon: Upload,
    href: "/transactions",
  },
  {
    title: "Import Amazon Invoice",
    description: "Upload payment details",
    icon: FileSpreadsheet,
    href: "/amazon-invoices",
  },
  {
    title: "Import Trips",
    description: "Upload scheduler export",
    icon: Truck,
    href: "/trips",
  },
  {
    title: "View Forecasting",
    description: "Predict weekly revenue",
    icon: BarChart3,
    href: "/forecasting",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks</CardDescription>
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
