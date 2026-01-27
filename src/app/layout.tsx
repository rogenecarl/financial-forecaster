import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import QueryProvider from "@/context/QueryProvider";
import { SessionProvider } from "@/components/providers";
import { getServerSession } from "@/lib/auth-server";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Financial Forecaster | Peak Transport",
  description: "Internal financial management system for Peak Transport LLC. Bookkeeping, Forecasting, and Reporting.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch session server-side - uses cookie cache, no waterfall
  const session = await getServerSession();

  return (
    // <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} antialiased font-sans`}
      >
        <QueryProvider>
          <SessionProvider initialSession={session}>
            <NextTopLoader showSpinner={false} height={2} color="#34d399" />
            <Toaster position="bottom-right"/>
            <main className="min-h-screen">
              {children}
            </main>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
