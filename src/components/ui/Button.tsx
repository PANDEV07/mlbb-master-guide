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
    "border border-emerald-400/50 bg-emerald-500 text-slate-950 font-semibold shadow-sm shadow-emerald-950/50 hover:bg-emerald-400 focus-visible:outline-emerald-400",
  secondary:
    "border border-[#263542] bg-[#151D24] text-slate-100 hover:border-emerald-400/40 hover:bg-[#1B252E] focus-visible:outline-emerald-400",
  ghost:
    "border border-transparent bg-transparent text-slate-300 hover:bg-white/5 hover:text-white focus-visible:outline-slate-400",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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
