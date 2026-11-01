"use client";
import { useId, useState } from "react";
interface Series {
  label: string;
  color: string;
  values: (number | null)[];
}
function smooth(points: [number, number][]) {
  return points
    .map(([x, y], i) => {
      if (!i) return `M${x},${y}`;
      const a = points[Math.max(0, i - 2)],
        b = points[i - 1],
        d = points[Math.min(points.length - 1, i + 1)];
      return `C${b[0] + (x - a[0]) / 6},${b[1] + (y - a[1]) / 6} ${x - (d[0] - b[0]) / 6},${y - (d[1] - b[1]) / 6} ${x},${y}`;
    })
    .join(" ");
}
export function TrendChart({
  series,
  labels = [],
  height = 160,
}: {
  series: Series[];
  labels?: string[];
  height?: number;
}) {
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const width = 600,
    pad = 12,
    n = Math.max(...series.map((s) => s.values.length), 1);
  const x = (i: number) =>
    n === 1 ? width / 2 : pad + (i / (n - 1)) * (width - pad * 2);
  const y = (v: number) =>
    pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
  function select(clientX: number, rect: DOMRect) {
    setSelected(
      Math.max(
        0,
        Math.min(
          n - 1,
          Math.round(
            ((((clientX - rect.left) / rect.width) * width - pad) /
              (width - pad * 2)) *
              (n - 1),
          ),
        ),
      ),
    );
  }
  return (
    <div className="relative min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded"
        style={{ height }}
        role="img"
        aria-label="Delivery and student mastery trajectory"
        tabIndex={0}
        onPointerMove={(e) =>
          select(e.clientX, e.currentTarget.getBoundingClientRect())
        }
        onPointerDown={(e) =>
          select(e.clientX, e.currentTarget.getBoundingClientRect())
        }
        onPointerLeave={() => setSelected(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setSelected((i) =>
              Math.max(
                0,
                Math.min(n - 1, (i ?? 0) + (e.key === "ArrowRight" ? 1 : -1)),
              ),
            );
          }
          if (e.key === "Escape") setSelected(null);
        }}
      >
        {[25, 50, 75].map((v) => (
          <line
            key={v}
            x1={0}
            x2={width}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--line)"
            strokeDasharray="3 5"
          />
        ))}
        {series.map((s, si) => {
          const groups: [number, number][][] = [];
          let group: [number, number][] = [];
          s.values.forEach((v, i) => {
            if (v === null) {
              if (group.length) groups.push(group);
              group = [];
            } else group.push([x(i), y(v)]);
          });
          if (group.length) groups.push(group);
          return (
            <g key={s.label}>
              <defs>
                <linearGradient id={`${id}-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor={s.color} stopOpacity={0.13} />
                  <stop offset="1" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              {groups.map((pts, gi) => (
                <g key={gi}>
                  {si === 0 && pts.length > 1 && (
                    <path
                      d={`${smooth(pts)} L${pts.at(-1)![0]},${height} L${pts[0][0]},${height} Z`}
                      fill={`url(#${id}-${si})`}
                    />
                  )}
                  <path
                    d={smooth(pts)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={si === 0 ? 2.5 : 2}
                    strokeDasharray={si === 0 ? undefined : "5 4"}
                    vectorEffect="non-scaling-stroke"
                  />
                  {pts.map(([px, py], i) => (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r={2.5}
                      fill={s.color}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
              ))}
            </g>
          );
        })}
        {selected !== null && (
          <g>
            <line
              x1={x(selected)}
              x2={x(selected)}
              y1={pad}
              y2={height - pad}
              stroke="var(--line-strong)"
            />
            {series.map(
              (s) =>
                s.values[selected] != null && (
                  <circle
                    key={s.label}
                    cx={x(selected)}
                    cy={y(s.values[selected]!)}
                    r={4}
                    fill={s.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ),
            )}
          </g>
        )}
      </svg>
      {selected !== null && (
        <div
          role="status"
          className="absolute top-0 right-2 bg-white border border-line rounded-lg p-3 text-xs shadow-sm pointer-events-none max-w-[240px]"
        >
          <b>{labels[selected] ?? `Lesson ${selected + 1}`}</b>
          {series.map((s) => (
            <div key={s.label} style={{ color: s.color }}>
              {s.label}: {s.values[selected] ?? "—"}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-4 mt-3">
        {series.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-2 text-[11.5px] text-muted"
          >
            <i
              className="size-1.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <details className="mt-2 text-[12px] text-dim">
        <summary>Chart values</summary>
        <ul>
          {Array.from({ length: n }, (_, i) => (
            <li key={i}>
              {labels[i] ?? `Lesson ${i + 1}`}:{" "}
              {series
                .map((s) => `${s.label} ${s.values[i] ?? "unavailable"}`)
                .join(" · ")}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
