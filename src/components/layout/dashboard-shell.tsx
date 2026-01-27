"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

// Custom hook for localStorage with SSR support
function useLocalStorage(key: string, defaultValue: boolean) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }, []);

  const getSnapshot = useCallback(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === "true" : defaultValue;
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function DashboardShell({ children }: DashboardShellProps) {
  const storedCollapsed = useLocalStorage(SIDEBAR_COLLAPSED_KEY, false);
  const [isCollapsed, setIsCollapsed] = useState(storedCollapsed);

  // Save collapsed state to localStorage
  const handleCollapsedChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isCollapsed={isCollapsed} onCollapsedChange={handleCollapsedChange} />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isCollapsed ? "md:ml-0" : "md:ml-0"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
