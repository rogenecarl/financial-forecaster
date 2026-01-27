"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  Wallet,
  FileBarChart,
  Shield,
  Upload,
  LineChart,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI-Powered Forecasting",
    description:
      "Predict weekly Amazon payouts with >98% accuracy using advanced regression models trained on years of historical logistics data. Get insights before they happen.",
    icon: BrainCircuit,
    color: "emerald",
    size: "large",
    visual: "chart",
  },
  {
    title: "Smart Bookkeeping",
    description:
      "Automated transaction categorization that learns from your corrections and improves over time.",
    icon: Wallet,
    color: "amber",
    size: "small",
    visual: "wallet",
  },
  {
    title: "Real-time Reports",
    description:
      "Generate comprehensive P&L statements in seconds. Export-ready formats for stakeholders.",
    icon: FileBarChart,
    color: "teal",
    size: "small",
    visual: "report",
  },
  {
    title: "Enterprise Security",
    description:
      "Role-based access control with audit logging. SOC 2 compliant infrastructure for peace of mind.",
    icon: Shield,
    color: "violet",
    size: "medium",
    visual: "shield",
  },
  {
    title: "Seamless Data Import",
    description:
      "Drag-and-drop CSV and Excel imports with intelligent field mapping and validation.",
    icon: Upload,
    color: "sky",
    size: "small",
    visual: "upload",
  },
  {
    title: "Variance Analysis",
    description:
      "Visual performance metrics with drill-down capabilities. Spot anomalies instantly.",
    icon: LineChart,
    color: "rose",
    size: "small",
    visual: "variance",
  },
];

const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    glow: "from-emerald-500/20",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "from-amber-500/20",
    border: "border-amber-500/20",
  },
  teal: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    glow: "from-teal-500/20",
    border: "border-teal-500/20",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    glow: "from-violet-500/20",
    border: "border-violet-500/20",
  },
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    glow: "from-sky-500/20",
    border: "border-sky-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    glow: "from-rose-500/20",
    border: "border-rose-500/20",
  },
};

function AnimatedChart() {
  return (
    <svg className="w-full h-full" viewBox="0 0 200 100" fill="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 80 Q30 60 50 65 T100 45 T150 55 T200 25 V100 H0 Z"
        fill="url(#chartGradient)"
        className="animate-pulse"
      />
      <path
        d="M0 80 Q30 60 50 65 T100 45 T150 55 T200 25"
        stroke="rgb(52, 211, 153)"
        strokeWidth="2"
        fill="none"
        className="[stroke-dasharray:500] [stroke-dashoffset:500] animate-[line-draw_2s_ease-out_forwards]"
      />
      <circle cx="200" cy="25" r="4" fill="rgb(52, 211, 153)" className="animate-pulse" />
    </svg>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colors = colorMap[feature.color];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const sizeClasses = {
    large: "md:col-span-2 md:row-span-2",
    medium: "md:col-span-2",
    small: "md:col-span-1",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-3xl transition-all duration-500",
        "border border-white/[0.06] bg-white/[0.02]",
        "hover:border-white/[0.12] hover:bg-white/[0.04]",
        sizeClasses[feature.size as keyof typeof sizeClasses],
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Hover Glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-br",
          colors.glow,
          "to-transparent"
        )}
      />

      {/* Content */}
      <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
              colors.bg,
              "group-hover:scale-110"
            )}
          >
            <feature.icon className={cn("h-6 w-6", colors.text)} />
          </div>
          <ArrowUpRight
            className="h-5 w-5 text-neutral-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
          />
        </div>

        {/* Text */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-300 transition-all">
            {feature.title}
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Visual Element for Large Cards */}
        {feature.size === "large" && (
          <div className="mt-6 h-32 rounded-2xl bg-black/30 border border-white/5 overflow-hidden">
            <AnimatedChart />
          </div>
        )}

        {/* Bottom Accent Line */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            "bg-gradient-to-r from-transparent",
            colors.glow.replace("from-", "via-"),
            "to-transparent"
          )}
        />
      </div>

      {/* Corner Decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-white/[0.02] to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-32 bg-[#030508] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 geometric-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
              master your finances
            </span>
          </h2>

          <p className="text-lg text-neutral-400 leading-relaxed">
            A comprehensive suite of tools designed specifically for logistics operations.
            From automated bookkeeping to AI-powered predictions.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[280px]">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
