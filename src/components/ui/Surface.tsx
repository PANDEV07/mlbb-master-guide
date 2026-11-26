import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SurfaceProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  chamfered?: boolean;
}

export function Surface({
  children,
  className,
  elevated = false,
  chamfered = true,
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "border shadow-[0_1px_0_0_rgba(34,211,238,0.06)_inset]",
        chamfered
          ? elevated
            ? "mlbb-card-elevated shadow-lg shadow-black/35"
            : "mlbb-card"
          : elevated
            ? "rounded-lg border-[#22D3EE]/35 bg-[#15203E] shadow-lg shadow-black/35"
            : "rounded-lg border-[#22D3EE]/25 bg-[#101830]",
        className,
      )}
    >
      {children}
    </div>
  );
}
