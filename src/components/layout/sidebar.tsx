"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  dashboardNavigation,
  isNavGroup,
  type NavElement,
  type NavItem,
} from "@/config/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  DollarSign,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Bookkeeping: true,
    Forecasting: true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActiveLink = (href: string) => pathname === href;

  const isGroupActive = (items: NavItem[]) =>
    items.some((item) => pathname === item.href);

  const renderNavItem = (item: NavItem, nested = false) => {
    const isActive = isActiveLink(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          isCollapsed && "justify-center px-2",
          nested && !isCollapsed && "ml-4"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="flex-1">{item.title}</span>}
        {!isCollapsed && item.badge && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            {item.title}
            {item.badge && (
              <span className="ml-auto text-muted-foreground">{item.badge}</span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  const renderNavGroup = (group: { title: string; items: NavItem[] }) => {
    const isOpen = openGroups[group.title] ?? true;
    const hasActiveItem = isGroupActive(group.items);

    if (isCollapsed) {
      // When collapsed, show group items as tooltips
      return (
        <div key={group.title} className="space-y-1">
          {group.items.map((item) => renderNavItem(item))}
        </div>
      );
    }

    return (
      <Collapsible
        key={group.title}
        open={isOpen}
        onOpenChange={() => toggleGroup(group.title)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              hasActiveItem
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span className="flex-1 text-left">{group.title}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pt-1">
          {group.items.map((item) => renderNavItem(item, true))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderNavElement = (element: NavElement) => {
    if (isNavGroup(element)) {
      return renderNavGroup(element);
    }
    return renderNavItem(element);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 md:flex",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 transition-opacity",
              isCollapsed && "opacity-0 pointer-events-none"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Financial Forecaster</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 shrink-0"
            onClick={() => onCollapsedChange(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1">
            {dashboardNavigation.map(renderNavElement)}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
