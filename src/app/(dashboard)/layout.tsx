import { requireAuth } from "@/lib/auth-server";
import { DashboardShell } from "@/components/layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check - redirects to login if not authenticated
  await requireAuth();

  return <DashboardShell>{children}</DashboardShell>;
}
