"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Menu, ChevronDown, DollarSign } from "lucide-react";

interface MobileNavProps {
  children?: React.ReactNode;
}

export function MobileNav({ children }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          nested && "ml-4"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: { title: string; items: NavItem[] }) => {
    const isOpen = openGroups[group.title] ?? true;
    const hasActiveItem = isGroupActive(group.items);

    return (
      <Collapsible
        key={group.title}
        open={isOpen}
        onOpenChange={() => toggleGroup(group.title)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
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

  // Separate settings from main navigation
  const mainNavItems = dashboardNavigation.filter(
    (item) => !isNavGroup(item) || item.title !== "Settings"
  );
  const settingsItem = dashboardNavigation.find(
    (item) => !isNavGroup(item) && (item as NavItem).title === "Settings"
  ) as NavItem | undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Financial Forecaster</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <nav className="p-3 space-y-1">
            {mainNavItems.map(renderNavElement)}
          </nav>
        </ScrollArea>
        {settingsItem && (
          <>
            <Separator />
            <div className="p-3">{renderNavItem(settingsItem)}</div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
