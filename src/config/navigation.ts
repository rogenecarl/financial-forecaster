import {
  LayoutDashboard,
  Receipt,
  FileText,
  FileSpreadsheet,
  Truck,
  TrendingUp,
  GitCompare,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export type NavElement = NavItem | NavGroup;

export function isNavGroup(item: NavElement): item is NavGroup {
  return "items" in item;
}

export const dashboardNavigation: NavElement[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Bookkeeping",
    items: [
      {
        title: "Transactions",
        href: "/transactions",
        icon: Receipt,
      },
      {
        title: "P&L Statement",
        href: "/pl-statement",
        icon: FileText,
      },
    ],
  },
  {
    title: "Forecasting",
    items: [
      {
        title: "Amazon Invoices",
        href: "/amazon-invoices",
        icon: FileSpreadsheet,
      },
      {
        title: "Trips",
        href: "/trips",
        icon: Truck,
      },
      {
        title: "Forecasting",
        href: "/forecasting",
        icon: TrendingUp,
      },
      {
        title: "Forecast vs Actual",
        href: "/forecast-vs-actual",
        icon: GitCompare,
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// Route metadata for breadcrumbs and page titles
export const routeMeta: Record<string, { title: string; description?: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of your financial performance",
  },
  "/transactions": {
    title: "Transactions",
    description: "Track and categorize your bank transactions",
  },
  "/pl-statement": {
    title: "P&L Statement",
    description: "Financial performance summary",
  },
  "/amazon-invoices": {
    title: "Amazon Invoices",
    description: "Import and analyze Amazon payment details",
  },
  "/trips": {
    title: "Trips",
    description: "Manage scheduled trips and track actual loads",
  },
  "/forecasting": {
    title: "Forecasting",
    description: "Predict weekly revenue and model scenarios",
  },
  "/forecast-vs-actual": {
    title: "Forecast vs Actual",
    description: "Compare predictions with actual Amazon payments",
  },
  "/reports": {
    title: "Reports",
    description: "Generate and export financial reports",
  },
  "/settings": {
    title: "Settings",
    description: "Configure categories, rules, and preferences",
  },
};

// Helper to get breadcrumb items from pathname
export function getBreadcrumbs(pathname: string): Array<{ title: string; href: string }> {
  const breadcrumbs: Array<{ title: string; href: string }> = [];

  // Always start with Dashboard
  if (pathname !== "/dashboard") {
    breadcrumbs.push({ title: "Dashboard", href: "/dashboard" });
  }

  // Add current page
  const meta = routeMeta[pathname];
  if (meta) {
    breadcrumbs.push({ title: meta.title, href: pathname });
  }

  return breadcrumbs;
}
