import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "gold" | "blue" | "emerald" | "amber" | "rose";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "border-[#22D3EE]/25 bg-[#0D1328] text-[#9AA6C4]",
  gold: "border-[#F5B83D]/45 bg-[#F5B83D]/15 text-[#F5B83D]",
  blue: "border-[#22D3EE]/40 bg-[#22D3EE]/12 text-[#22D3EE]",
  emerald: "border-[#4ADE80]/40 bg-[#4ADE80]/12 text-[#4ADE80]",
  amber: "border-[#F5B83D]/40 bg-[#F5B83D]/12 text-[#F5B83D]",
  rose: "border-[#E11D48]/50 bg-[#E11D48]/15 text-[#FB7185]",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
