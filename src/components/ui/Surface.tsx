import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SurfaceProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Surface({
  children,
  className,
  elevated = false,
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1E2A33] shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]",
        elevated
          ? "bg-[#151D24]/95 shadow-lg shadow-black/25"
          : "bg-[#10161B]/90",
        className,
      )}
    >
      {children}
    </div>
  );
}
