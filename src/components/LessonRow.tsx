import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LessonSummary } from "@/lib/types";
import { formatDate, formatDuration, scoreColor } from "./ui";

export function LessonRow({ lesson }: { lesson: LessonSummary }) {
  const a = lesson.analysis;
  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="group lesson-row"
    >
      <div
        className="grid place-items-center size-10 shrink-0 rounded-[8px] border font-semibold tabular-nums"
        style={{
          borderColor: a ? scoreColor(a.overall) : "var(--line)",
          color: a ? scoreColor(a.overall) : "var(--muted)",

        }}
      >
        {a ? a.overall : "–"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-[13px] truncate">{lesson.title}</div>
        <div className="text-xs text-muted truncate mt-0.5">
          {lesson.subject}
          {lesson.yearGroup && ` · ${lesson.yearGroup}`} · {formatDate(lesson.date)}
          {a && ` · ${formatDuration(a.metrics.durationSec)}`}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        {lesson.assessment ? (
          <span className="chip" style={{ color: "var(--pink)", borderColor: "color-mix(in srgb, var(--pink) 35%, transparent)" }}>
            {lesson.assessment.masteryPct}% mastery
          </span>
        ) : (
          <span className="chip">no exit ticket</span>
        )}
      </div>
      <ChevronRight size={16} className="text-dim group-hover:text-text transition-colors shrink-0" />
    </Link>
  );
}
