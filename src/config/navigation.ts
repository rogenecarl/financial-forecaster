import {
  LayoutDashboard,
  Receipt,
  FileText,
  Truck,
  TrendingUp,
  GitCompare,
  BarChart3,
  Tags,
  LineChart,
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
        title: "Categories",
        href: "/categories",
        icon: Tags,
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
        title: "Trip Management",
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
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: LineChart,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
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
  "/categories": {
    title: "Categories",
    description: "Manage categories for transaction classification",
  },
  "/pl-statement": {
    title: "P&L Statement",
    description: "Financial performance summary",
  },
  "/trips": {
    title: "Trip Management",
    description: "Organize trips and invoices into batches for easier tracking",
  },
  "/forecasting": {
    title: "Forecasting",
    description: "Predict weekly revenue and model scenarios",
  },
  "/forecast-vs-actual": {
    title: "Forecast vs Actual",
    description: "Compare batch projections with actual invoice payments",
  },
  "/analytics": {
    title: "Analytics",
    description: "Year-over-year performance analysis and trends",
  },
  "/reports": {
    title: "Reports",
    description: "Generate and export financial reports",
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
