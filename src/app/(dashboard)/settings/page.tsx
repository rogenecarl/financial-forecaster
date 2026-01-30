"use client";

import { CategoriesSection } from "@/components/settings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage categories for transaction classification
        </p>
      </div>

      {/* Categories Section */}
      <CategoriesSection />
    </div>
  );
}
