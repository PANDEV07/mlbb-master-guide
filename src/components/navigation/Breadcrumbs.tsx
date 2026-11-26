import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbEntry[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
      <Link href="/" className="transition-colors hover:text-slate-200">
        MLBB Master Guide
      </Link>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-slate-200">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
