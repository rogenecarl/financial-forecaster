"use client";

const technologies = [
  { name: "Next.js 16", category: "Framework" },
  { name: "React 19", category: "UI Library" },
  { name: "TypeScript", category: "Language" },
  { name: "Tailwind CSS 4", category: "Styling" },
  { name: "Prisma 7", category: "ORM" },
  { name: "Better Auth", category: "Auth" },
  { name: "TanStack Query", category: "Data" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Vercel AI", category: "ML" },
  { name: "Zod 4", category: "Validation" },
];

function TechItem({ name, category }: { name: string; category: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 mx-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all duration-300 group cursor-default shrink-0">
      <div className="h-2 w-2 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors" />
      <div>
        <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
          {name}
        </span>
        <span className="ml-2 text-xs text-neutral-600 uppercase tracking-wider">
          {category}
        </span>
      </div>
    </div>
  );
}

export function TechStack() {
  // Duplicate for seamless scroll
  const allTech = [...technologies, ...technologies];

  return (
    <section id="tech-stack" className="relative py-20 bg-[#020304] overflow-hidden border-y border-white/[0.04]">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020304] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020304] to-transparent z-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 mb-12">
        <div className="text-center">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-[0.2em] mb-2">
            Built with
          </p>
          <h3 className="text-2xl font-bold text-white">
            Next-Generation Technology
          </h3>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="relative">
        <div className="flex animate-ticker">
          {allTech.map((tech, i) => (
            <TechItem key={`${tech.name}-${i}`} {...tech} />
          ))}
        </div>
      </div>

      {/* Reverse scroll row */}
      <div className="relative mt-4">
        <div
          className="flex animate-ticker"
          style={{ animationDirection: "reverse", animationDuration: "35s" }}
        >
          {[...allTech].reverse().map((tech, i) => (
            <TechItem key={`${tech.name}-rev-${i}`} {...tech} />
          ))}
        </div>
      </div>
    </section>
  );
}
