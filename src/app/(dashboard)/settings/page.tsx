"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesSection, LoadCountingSection } from "@/components/settings";
import { Palette, Truck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage categories and load counting configuration
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 h-auto p-1">
          <TabsTrigger
            value="categories"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <Palette className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger
            value="load-counting"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <Truck className="h-4 w-4" />
            <span>Load Counting</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <CategoriesSection />
        </TabsContent>

        <TabsContent value="load-counting" className="space-y-6 mt-6">
          <LoadCountingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
