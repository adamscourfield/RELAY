import { AnimatedNumber } from "./Feedback";
import { TrendChart } from "./TrendChart";
export { TrendChart };
import type { ReactNode } from "react";
import { LEVEL_NAMES } from "@/lib/rubric";

export function scoreColor(pct: number) {
  if (pct >= 75) return "var(--lime)";
  if (pct >= 55) return "var(--cyan)";
  if (pct >= 35) return "var(--amber)";
  return "var(--red)";
}

export function levelColor(level: number) {
  return ["var(--red)", "var(--amber)", "var(--cyan)", "var(--lime)"][
    Math.max(0, Math.min(3, Math.round(level) - 1))
  ];
}

export { ScoreRing } from "./ScoreRing";

export function LevelBar({ score }: { score: number }) {
  return (
    <div
      className="flex gap-1"
      title={`${LEVEL_NAMES[score - 1]} (${score}/4)`}
    >
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: i <= score ? levelColor(score) : "var(--track)",
          }}
        />
      ))}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="glass metric-card px-[18px] py-4 min-w-0">
      <div className="eyebrow truncate">{label}</div>
      <div
        className="metric-value mt-2 text-[26px] font-semibold tracking-tight tabular-nums"
        style={{ color: accent }}
      >
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      {hint && <div className="metric-hint mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-header rise">
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass p-10 text-center">
      <div className="text-lg font-medium">{title}</div>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(sec: number) {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}
