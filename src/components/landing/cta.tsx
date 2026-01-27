"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const benefits = [
  "AI-powered forecasting",
  "Real-time analytics",
  "Secure & compliant",
  "Dedicated support",
];

export function CTA() {
  return (
    <section className="relative py-32 bg-[#030508] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 geometric-grid opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-900/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-teal-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="relative rounded-[2.5rem] overflow-hidden">
          {/* Animated border */}
          <div className="absolute inset-0 rounded-[2.5rem] p-px bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-amber-500/50 animate-gradient">
            <div className="absolute inset-px rounded-[calc(2.5rem-1px)] bg-[#0a0f14]" />
          </div>

          {/* Content */}
          <div className="relative px-8 py-20 sm:px-16 sm:py-24 text-center">
            {/* Internal glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-300">
                Start Free Today
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Ready to predict
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-200">
                your financial future?
              </span>
            </h2>

            <p className="mx-auto max-w-2xl text-lg text-neutral-400 mb-10 leading-relaxed">
              Join thousands of finance teams using Financial Forecaster to make
              smarter, data-driven decisions every day.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-neutral-300"
                >
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              asChild
              className="group relative h-16 px-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-bold text-lg hover:from-emerald-300 hover:to-teal-300 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-emerald-500/30"
            >
              <Link href="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <p className="mt-6 text-sm text-neutral-500">
              No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
