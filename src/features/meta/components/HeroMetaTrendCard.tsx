import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { HeroMetaTrendSummary } from "../engine/meta-trend-engine";

interface HeroMetaTrendCardProps {
  trend: HeroMetaTrendSummary | null;
}

function formatDeltaPct(delta: number): string {
  const pct = delta * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function HeroMetaTrendCard({ trend }: HeroMetaTrendCardProps) {
  if (!trend || trend.points.length === 0) return null;

  const points = trend.points;

  // Bangun koordinat SVG polyline bila >= 2 snapshot
  const width = 240;
  const height = 64;
  const padX = 8;
  const padY = 10;

  let polylinePoints = "";
  const circles: Array<{ x: number; y: number; date: string; wr: number }> = [];

  if (points.length >= 2) {
    const wrs = points.map((p) => p.winRate);
    const minWr = Math.min(...wrs) - 0.005;
    const maxWr = Math.max(...wrs) + 0.005;
    const span = Math.max(0.01, maxWr - minWr);

    points.forEach((p, idx) => {
      const x =
        padX + (idx / Math.max(1, points.length - 1)) * (width - padX * 2);
      const y =
        height - padY - ((p.winRate - minWr) / span) * (height - padY * 2);
      circles.push({ x, y, date: p.snapshotDate, wr: p.winRate });
    });
    polylinePoints = circles
      .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");
  }

  const wrDelta = trend.winRateDelta;
  const tierDelta = trend.tierDelta;

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-xs text-[#22D3EE]">
          Tren Win Rate Mingguan
        </span>
        {trend.hasHistoricalComparison && wrDelta !== null ? (
          <span
            className={`font-display inline-flex items-center gap-1 text-xs ${
              wrDelta > 0
                ? "text-[#4ADE80]"
                : wrDelta < 0
                  ? "text-[#FB7185]"
                  : "text-[#9AA6C4]"
            }`}
          >
            {wrDelta > 0 ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : wrDelta < 0 ? (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {formatDeltaPct(wrDelta)}
          </span>
        ) : (
          <span className="text-[10px] text-[#9AA6C4]">
            Snapshot #{trend.snapshotCount}
          </span>
        )}
      </div>

      {trend.hasHistoricalComparison ? (
        <div className="mt-2 space-y-1.5">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-16 w-full"
            role="img"
            aria-label={`Grafik tren Win Rate ${trend.heroSlug} dari ${points.length} snapshot resmi Moonton`}
          >
            <path
              d={`M${padX} ${height / 2}H${width - padX}`}
              stroke="#2A3563"
              strokeDasharray="3 3"
            />
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2.5"
            />
            {circles.map((c) => (
              <circle
                key={c.date}
                cx={c.x}
                cy={c.y}
                r="3.5"
                fill="#F5B83D"
              />
            ))}
          </svg>
          <div className="flex items-center justify-between text-[10px] text-[#9AA6C4]">
            <span>{points[0]?.snapshotDate}</span>
            {tierDelta !== null && tierDelta !== 0 && (
              <span
                className={`font-display ${
                  tierDelta > 0 ? "text-[#4ADE80]" : "text-[#FB7185]"
                }`}
              >
                Tier {trend.previousTier} → {trend.currentTier}
              </span>
            )}
            <span>{points[points.length - 1]?.snapshotDate}</span>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#9AA6C4]">
          Baseline tercatat{" "}
          <strong className="text-[#E6EAF5]">{trend.latestDate}</strong>.
          Grafik naik/turun otomatis aktif mulai snapshot mingguan berikutnya.
        </p>
      )}
    </div>
  );
}
