"use client";
import { useId, type CSSProperties } from "react";
import { AnimatedNumber } from "./Feedback";
export function ScoreRing({
  value,
  size = 140,
  stroke = 10,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = "var(--coral)";
  const id = useId();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="var(--coral)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
          className="score-arc"
          style={{ "--ring-circumference": c } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className="font-semibold tracking-tight tabular-nums"
            style={{ fontSize: size * 0.28 }}
          >
            <AnimatedNumber value={value} />
          </div>
          {label && <div className="eyebrow !text-[9px] -mt-0.5">{label}</div>}
        </div>
      </div>
    </div>
  );
}
