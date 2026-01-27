"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Hook to safely check if component is mounted (client-side)
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Hero() {
  const mounted = useIsMounted();

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#030508] pt-28 pb-20">
      {/* Layered Background Effects */}
      <div className="absolute inset-0 geometric-grid opacity-30" />

      {/* Central Gradient Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-transparent rounded-full blur-[150px] animate-pulse-glow" />

      {/* Secondary Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/3 right-1/3 w-[200px] h-[200px] bg-amber-500/5 rounded-full blur-[60px] animate-pulse-glow" style={{ animationDelay: "3s" }} />

      {/* Grain Overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Decorative Line */}
      <div className="absolute bottom-32 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />

      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 left-[15%] w-2 h-2 rounded-full bg-emerald-400/40 animate-float" />
      <div className="absolute top-1/3 right-[20%] w-1.5 h-1.5 rounded-full bg-teal-400/30 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/3 left-[25%] w-1 h-1 rounded-full bg-amber-400/30 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-2/3 right-[15%] w-2 h-2 rounded-full bg-emerald-400/20 animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 w-full">
        {/* Centered Content */}
        <div className={`flex flex-col items-center text-center space-y-8 ${mounted ? "animate-reveal-up" : "opacity-0"}`}>
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
            <span className="text-white">Predict Your</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 animate-gradient">
              Financial Future
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-neutral-400 leading-relaxed max-w-2xl">
            AI-powered financial forecasting, intelligent bookkeeping, and real-time analytics.
            Make data-driven decisions with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
            <Button
              size="lg"
              asChild
              className="group relative h-14 px-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-bold text-base hover:from-emerald-300 hover:to-teal-300 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/25"
            >
              <Link href="/login">
                Start Forecasting
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              asChild
              className="h-14 px-8 rounded-2xl text-neutral-300 hover:text-white hover:bg-white/5 font-medium text-base border border-white/10 hover:border-white/20 transition-all"
            >
              <Link href="#features">
                Explore Features
              </Link>
            </Button>
          </div>

        </div>
      </div>

    </section>
  );
}
