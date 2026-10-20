import type {
  LessonSummary,
  MisconceptionEvidence,
  MisconceptionFollowUp,
} from "./types";
export const normalise = (text: string) =>
  text.trim().replace(/\s+/g, " ").toLowerCase();
export const misconceptionGroupId = (yearGroup: string, text: string) =>
  JSON.stringify([normalise(yearGroup || "Unassigned"), normalise(text)]);
export interface MisconceptionGroup {
  id: string;
  yearGroup: string;
  text: string;
  /** Sum of teacher-entered counts (x7, "4 students"). Not a unique-student figure. */
  reportedCount: number;
  /** Replies heard in lesson recordings and judged to reveal this idea. One per reply. */
  heardCount: number;
  unknownCounts: number;
  lessons: { id: string; title: string; date: string }[];
  evidence: (MisconceptionEvidence & {
    lessonId: string;
    lessonTitle: string;
  })[];
  suggestedAction: string;
  addressed: boolean;
  observations: string[];
}
/** Everything on file for a group: teacher-reported plus heard in lessons. Still instances, not students. */
export const groupInstances = (g: Pick<MisconceptionGroup, "reportedCount" | "heardCount">) =>
  g.reportedCount + g.heardCount;

const DEFAULT_ACTION = (text: string) =>
  `Re-teach with a worked example contrasting the correct method with “${text}”, then use one check question that isolates the error.`;

export function groupMisconceptions(
  lessons: LessonSummary[],
  followUps: MisconceptionFollowUp[] = [],
): MisconceptionGroup[] {
  const groups = new Map<string, MisconceptionGroup>();
  for (const lesson of lessons) {
    const seen = new Set<string>();
    for (const mc of lesson.assessment?.misconceptions ?? []) {
      const id = misconceptionGroupId(lesson.yearGroup, mc.text);
      let group = groups.get(id);
      if (!group) {
        group = {
          id,
          yearGroup: lesson.yearGroup || "Unassigned",
          text: mc.text,
          reportedCount: 0,
          heardCount: 0,
          unknownCounts: 0,
          lessons: [],
          evidence: [],
          suggestedAction: mc.suggestedAction || DEFAULT_ACTION(mc.text),
          addressed: false,
          observations: [],
        };
        groups.set(id, group);
      }
      group.reportedCount += mc.studentCount ?? 0;
      if (mc.studentCount === undefined) group.unknownCounts++;
      if (!seen.has(id)) {
        group.lessons.push({
          id: lesson.id,
          title: lesson.title,
          date: lesson.date,
        });
        seen.add(id);
      }
      const evidence = (mc.evidence ?? []).filter(
        (e) => e.provenance !== "demo" || lesson.source === "demo",
      );
      group.evidence.push(
        ...evidence.map((e) => ({
          ...e,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        })),
      );
      group.observations.push(
        JSON.stringify([
          lesson.id,
          normalise(mc.text),
          mc.studentCount ?? null,
          evidence,
          mc.suggestedAction ?? "",
        ]),
      );
    }
  }
  // Replies heard in the lesson recording. Evidence is the student's own words, verified against
  // the transcript when the analysis was made; the student is deliberately left unidentified.
  for (const lesson of lessons) {
    for (const ex of lesson.analysis?.exchanges ?? []) {
      const m = ex.misconception;
      if (!m) continue;
      const id = misconceptionGroupId(lesson.yearGroup, m.label);
      let group = groups.get(id);
      if (!group) {
        group = {
          id,
          yearGroup: lesson.yearGroup || "Unassigned",
          text: m.label,
          reportedCount: 0,
          heardCount: 0,
          unknownCounts: 0,
          lessons: [],
          evidence: [],
          suggestedAction: DEFAULT_ACTION(m.label),
          addressed: false,
          observations: [],
        };
        groups.set(id, group);
      }
      group.heardCount++;
      if (!group.lessons.some((l) => l.id === lesson.id))
        group.lessons.push({ id: lesson.id, title: lesson.title, date: lesson.date });
      group.evidence.push({
        student: "Unidentified student",
        answer: m.quote,
        explanation: ex.rationale ?? "",
        provenance: "transcript",
        segmentId: m.segmentId,
        question: ex.question,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
      });
      group.observations.push(JSON.stringify([lesson.id, "heard", normalise(m.label), m.segmentId, m.quote]));
    }
  }
  for (const group of groups.values()) {
    const state = followUps.find((f) => f.groupId === group.id);
    group.addressed = Boolean(
      state?.addressedAt &&
        group.observations.every((o) =>
          state.addressedObservations.includes(o),
        ),
    );
  }
  return [...groups.values()].sort(
    (a, b) =>
      a.yearGroup.localeCompare(b.yearGroup) ||
      groupInstances(b) - groupInstances(a) ||
      a.text.localeCompare(b.text),
  );
}
