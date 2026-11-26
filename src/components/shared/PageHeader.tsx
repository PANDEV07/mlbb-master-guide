import { Badge } from "@/components/ui/Badge";
import {
  Breadcrumbs,
  type BreadcrumbEntry,
} from "@/components/navigation/Breadcrumbs";

interface PageHeaderProps {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbEntry[];
  statusLabel?: string;
  phaseBadge?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  statusLabel,
  phaseBadge,
}: PageHeaderProps) {
  return (
    <header className="mb-7 border-b border-[#F5B83D]/25 pb-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="mlbb-heading text-3xl text-[#E6EAF5] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-[#9AA6C4] sm:text-base">
            {description}
          </p>
        </div>

        {(phaseBadge || statusLabel) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {phaseBadge && <Badge tone="gold">{phaseBadge}</Badge>}
            {statusLabel && <Badge tone="blue">{statusLabel}</Badge>}
          </div>
        )}
      </div>
    </header>
  );
}
