import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PlatformModuleSpec } from "@/types/knowledge";
import { Badge } from "@/components/ui/Badge";

interface ModuleScaffoldGridProps {
  modules: PlatformModuleSpec[];
}

export function ModuleScaffoldGrid({ modules }: ModuleScaffoldGridProps) {
  return (
    <div className="divide-y divide-[#1E2738] overflow-hidden rounded-xl border border-[#1E2738] bg-[#0E1420]">
      {modules.map((mod) => (
        <Link
          key={mod.id}
          href={mod.slug}
          className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#131B2B] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-semibold text-slate-100 group-hover:text-amber-200">
                {mod.title}
              </span>
              <code className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[11px] text-slate-400">
                {mod.slug}
              </code>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{mod.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Badge tone={mod.currentState === "RESEARCH_IN_PROGRESS" ? "gold" : "neutral"}>
              {mod.currentState === "RESEARCH_IN_PROGRESS" ? "Riset Berjalan" : "Skeleton Siap"}
            </Badge>
            <Badge tone="blue">{mod.phaseTarget}</Badge>
            <ArrowUpRight
              className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-300"
              aria-hidden="true"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
