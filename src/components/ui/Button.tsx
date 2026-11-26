import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

interface ActionButtonProps extends BaseButtonProps {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

interface LinkButtonProps extends BaseButtonProps {
  href: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "mlbb-btn-chamfer font-display bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_18px_rgba(245,184,61,0.3)] hover:bg-[#FFC757] hover:shadow-[0_0_22px_rgba(245,184,61,0.55)] focus-visible:outline-[#F5B83D]",
  secondary:
    "mlbb-btn-chamfer font-display border border-[#22D3EE]/45 bg-[#101830] text-[#22D3EE] hover:border-[#F5B83D]/70 hover:bg-[#15203E] hover:text-[#F5B83D] focus-visible:outline-[#22D3EE]",
  ghost:
    "border border-transparent bg-transparent text-[#9AA6C4] hover:bg-white/5 hover:text-[#F5B83D] focus-visible:outline-[#22D3EE]",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold tracking-wider transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function Button(props: ActionButtonProps | LinkButtonProps) {
  const { children, variant = "secondary", className } = props;
  const classes = cn(BASE_CLASSES, VARIANT_STYLES[variant], className);

  if (typeof props.href === "string") {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
