"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Track active section
      const sections = ["features", "metrics", "tech-stack"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Stack", href: "#tech-stack" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "py-3" : "py-6"
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <nav
          className={cn(
            "relative flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-500",
            isScrolled
              ? "glass-panel-strong shadow-2xl shadow-black/20"
              : "bg-transparent"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-black"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Financial
              </span>
              <span className="text-[10px] font-medium text-emerald-400/80 tracking-widest uppercase">
                Forecaster
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  activeSection === link.href.slice(1)
                    ? "text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {link.label}
                {activeSection === link.href.slice(1) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>

            <Button
              size="sm"
              asChild
              className="relative overflow-hidden rounded-xl bg-white text-black hover:bg-neutral-100 font-semibold px-5 h-10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href="/login">
                <span className="relative z-10">Get Started</span>
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
