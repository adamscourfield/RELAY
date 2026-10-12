import { RUBRIC } from "./rubric";
import type {
  Assessment,
  DimensionId,
  LessonSummary,
  Misconception,
  StudentResult,
} from "./types";

export const DEFAULT_MASTERY = 70;

/**
 * Parse assessment results. Accepts CSV/TSV with rows of `student, score[, max]`.
 * A header row is skipped automatically. `defaultMax` is used when no max column exists.
 */
export function parseResults(raw: string, defaultMax: number): StudentResult[] {
  if (!Number.isFinite(defaultMax) || defaultMax <= 0)
    throw new Error("Maximum score must be positive");
  const results: StudentResult[] = [];
  const names = new Set<string>();
  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const cells = line.split(/[,\t;]/).map((s) => s.trim());
    if (
      results.length === 0 &&
      cells[0]?.toLowerCase() === "student" &&
      cells[1]?.toLowerCase() === "score"
    )
      continue;
    const [student, score, max] = cells;
    if (cells.length < 2 || cells.length > 3 || !student || !score)
      throw new Error(`Row ${index + 1}: use student, score[, max]`);
    const value = Number(score),
      maximum = max ? Number(max) : defaultMax;
    if (
      !Number.isFinite(value) ||
      !Number.isFinite(maximum) ||
      maximum <= 0 ||
      value < 0 ||
      value > maximum
    )
      throw new Error(
        `Row ${index + 1}: score must be between 0 and a positive maximum`,
      );
    const key = student.toLowerCase();
    if (names.has(key))
      throw new Error(`Row ${index + 1}: duplicate student ${student}`);
    names.add(key);
    results.push({ student, score: value, max: maximum });
  }
  return results;
}

/**
 * Parse free-text misconception notes, one per line — what a teacher jots down while marking.
 * A trailing count ("x6", "(6 students)", "- 6 students") is read off the end; otherwise the
 * whole line is kept as the description with no count.
 */
export function parseMisconceptions(raw: string): Misconception[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(
        /^(.*?)[\s(]*(?:x\s?(\d+)|(\d+)\s*students?)\)?\s*$/i,
      );
      if (m && m[1].trim()) {
        const count = parseInt(m[2] ?? m[3], 10);
        return {
          id: `mc${i + 1}`,
          text: m[1].trim().replace(/[-–—,]\s*$/, ""),
          studentCount: Number.isFinite(count) ? count : undefined,
        };
      }
      return { id: `mc${i + 1}`, text: line };
    });
}

export function buildAssessment(
  kind: Assessment["kind"],
  results: StudentResult[],
  masteryThreshold = DEFAULT_MASTERY,
  misconceptions: Misconception[] = [],
): Assessment {
  const pcts = results.map((r) => (r.score / r.max) * 100);
  return {
    kind,
    uploadedAt: new Date().toISOString(),
    results,
    meanPct: pcts.length
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
      : 0,
    masteryPct: pcts.length
      ? Math.round(
          (pcts.filter((p) => p >= masteryThreshold).length / pcts.length) *
            100,
        )
      : 0,
    masteryThreshold,
    misconceptions,
  };
}

export type Verdict =
  | "aligned-strong"
  | "aligned-weak"
  | "delivery-not-landing"
  | "outcomes-beat-delivery";

/** Compare how the lesson *sounded* with what students *could do*. */
export function triangulate(
  overall: number,
  masteryPct: number,
): { verdict: Verdict; headline: string; detail: string } {
  const goodDelivery = overall >= 55;
  const goodOutcome = masteryPct >= 60;
  if (goodDelivery && goodOutcome)
    return {
      verdict: "aligned-strong",
      headline: "Delivery and outcomes agree",
      detail:
        "The teaching moves RELAY heard are showing up in what students can do. Keep these moves.",
    };
  if (!goodDelivery && !goodOutcome)
    return {
      verdict: "aligned-weak",
      headline: "Both signals point the same way",
      detail:
        "Delivery scored low and so did outcomes. Start with the top next step — it's the most likely lever.",
    };
  if (goodDelivery)
    return {
      verdict: "delivery-not-landing",
      headline: "It sounded good — it didn't land",
      detail:
        "The lesson ticked the rubric boxes but most students didn't reach mastery. Look at checks for understanding: were misconceptions surfaced and acted on? Was the exit ticket aligned to what was taught?",
    };
  return {
    verdict: "outcomes-beat-delivery",
    headline: "Students did better than the audio suggests",
    detail:
      "Outcomes were strong despite a modest delivery score. The effective part may be something audio can't hear (resources, prior teaching, silent practice) — or the assessment was too easy.",
  };
}

export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return +(num / Math.sqrt(dx * dy)).toFixed(2);
}

export interface Driver {
  key: string;
  label: string;
  r: number | null;
  n: number;
}

/** Which measured behaviours move with student outcomes across all lessons that have both. */
export function outcomeDrivers(lessons: LessonSummary[]): Driver[] {
  const paired = lessons.filter((l) => l.analysis && l.assessment);
  const y = paired.map((l) => l.assessment!.masteryPct);
  const dims: Driver[] = RUBRIC.map((d) => ({
    key: d.id,
    label: d.name,
    r: pearson(
      paired.map(
        (l) =>
          l.analysis!.dimensions.find((x) => x.id === (d.id as DimensionId))
            ?.score ?? 0,
      ),
      y,
    ),
    n: paired.length,
  }));
  const metric = (
    key: string,
    label: string,
    f: (l: LessonSummary) => number | null,
  ): Driver => {
    const rows = paired
      .map((l) => [f(l), l.assessment!.masteryPct] as const)
      .filter(([x]) => x !== null) as [number, number][];
    return {
      key,
      label,
      r: pearson(
        rows.map((r) => r[0]),
        rows.map((r) => r[1]),
      ),
      n: rows.length,
    };
  };
  return [
    ...dims,
    metric(
      "openQuestionPct",
      "% open questions",
      (l) => l.analysis!.metrics.openQuestionPct,
    ),
    metric(
      "meanWaitTime",
      "Mean wait time",
      (l) => l.analysis!.metrics.meanWaitTime,
    ),
    metric(
      "wpm",
      "Speaking pace (wpm)",
      (l) => l.analysis!.metrics.wordsPerMinute,
    ),
    metric(
      "teacherTalk",
      "Teacher talk %",
      (l) => l.analysis!.metrics.teacherTalkPct,
    ),
  ].sort((a, b) => Math.abs(b.r ?? 0) - Math.abs(a.r ?? 0));
}

export interface ClassMisconception {
  text: string;
  /** Sums each lesson's noted student count, or counts the lesson itself once when no count was given. */
  totalStudentCount: number;
  /** How many different lessons surfaced this. */
  occurrences: number;
  lessons: { id: string; title: string; date: string }[];
}

/** Slug used to link from a lesson's exit ticket to its class's section on the Misconceptions page. */
export function classSlug(yearGroup: string): string {
  return (
    (yearGroup || "unassigned")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "unassigned"
  );
}

/** Group misconceptions by class, merging identical (case/whitespace-insensitive) text across lessons. */
export function misconceptionsByClass(
  lessons: LessonSummary[],
): { yearGroup: string; items: ClassMisconception[] }[] {
  const byClass = new Map<string, Map<string, ClassMisconception>>();
  for (const l of lessons) {
    const mcs = l.assessment?.misconceptions;
    if (!mcs?.length) continue;
    const cls = l.yearGroup || "Unassigned";
    const items = byClass.get(cls) ?? new Map<string, ClassMisconception>();
    byClass.set(cls, items);
    for (const mc of mcs) {
      const key = mc.text.toLowerCase().trim();
      const existing = items.get(key);
      if (existing) {
        existing.totalStudentCount += mc.studentCount ?? 1;
        existing.occurrences += 1;
        existing.lessons.push({ id: l.id, title: l.title, date: l.date });
      } else {
        items.set(key, {
          text: mc.text,
          totalStudentCount: mc.studentCount ?? 1,
          occurrences: 1,
          lessons: [{ id: l.id, title: l.title, date: l.date }],
        });
      }
    }
  }
  return [...byClass.entries()]
    .map(([yearGroup, items]) => ({
      yearGroup,
      items: [...items.values()].sort(
        (a, b) =>
          b.totalStudentCount - a.totalStudentCount ||
          b.occurrences - a.occurrences,
      ),
    }))
    .sort((a, b) => a.yearGroup.localeCompare(b.yearGroup));
}
