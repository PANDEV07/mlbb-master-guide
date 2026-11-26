import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "gold" | "blue" | "emerald" | "amber" | "rose";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "border-[#25333E] bg-[#151E26] text-slate-300",
  gold: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  blue: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  emerald: "border-emerald-400/35 bg-emerald-500/15 text-emerald-200",
  amber: "border-orange-400/30 bg-orange-400/10 text-orange-200",
  rose: "border-rose-400/35 bg-rose-500/10 text-rose-200",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
