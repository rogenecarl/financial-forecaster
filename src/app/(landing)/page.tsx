import { Hero, Features, TechStack, CTA } from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030508] text-white selection:bg-emerald-500/30 overflow-x-hidden">
      <Hero />
      <Features />
      <TechStack />
      <CTA />
    </main>
  );
}
