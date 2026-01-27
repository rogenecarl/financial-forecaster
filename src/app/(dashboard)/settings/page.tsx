"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CategoriesSection,
  CategoryRulesSection,
  DefaultsSection,
  ExcludedAddressesSection,
  AISettingsSection,
} from "@/components/settings";
import { Palette, ListChecks, Settings2, MapPin, Brain } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure categories, rules, and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger
            value="categories"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Rules</span>
          </TabsTrigger>
          <TabsTrigger
            value="defaults"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Defaults</span>
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Addresses</span>
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <CategoriesSection />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6 mt-6">
          <CategoryRulesSection />
        </TabsContent>

        <TabsContent value="defaults" className="space-y-6 mt-6">
          <DefaultsSection />
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6 mt-6">
          <ExcludedAddressesSection />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6 mt-6">
          <AISettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
