"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { getBreadcrumbs, routeMeta } from "@/config/navigation";
import { DollarSign } from "lucide-react";
import { Fragment } from "react";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const currentMeta = routeMeta[pathname];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6",
        className
      )}
    >
      {/* Mobile Menu & Logo */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav />
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <DollarSign className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Financial Forecaster</span>
        </Link>
      </div>

      {/* Breadcrumb - Hidden on mobile */}
      <div className="hidden md:flex flex-1 items-center">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {crumb.title}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        {currentMeta?.description && (
          <span className="ml-4 text-sm text-muted-foreground hidden lg:inline">
            {currentMeta.description}
          </span>
        )}
      </div>

      {/* Right side - spacer for mobile, user menu */}
      <div className="flex-1 md:flex-none" />

      {/* User Menu */}
      <UserMenu />
    </header>
  );
}
