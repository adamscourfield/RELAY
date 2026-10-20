import type { Lesson, LessonAnalysis } from "../types";
import { getRoster } from "../roster";
import { claudeAnalysis, claudeAvailable } from "./claude";
import { heuristicAnalysis } from "./heuristic";

export interface AnalyseOptions {
  /** Misconception labels already on file for this class, offered to the judge for reuse. */
  knownMisconceptions?: string[];
}

export async function analyseLesson(
  lesson: Pick<Lesson, "segments" | "subject" | "yearGroup" | "title"> & { objective?: string },
  options: AnalyseOptions = {},
): Promise<LessonAnalysis> {
  if (claudeAvailable()) {
    try {
      const objective = lesson.objective ? ` Objective: ${lesson.objective}` : "";
      return await claudeAnalysis(
        lesson.segments,
        `${lesson.subject}, ${lesson.yearGroup}: "${lesson.title}".${objective}`,
        options,
      );
    } catch (err) {
      console.error("[relay] Claude analysis failed, falling back to heuristic engine:", err);
    }
  }
  return heuristicAnalysis(lesson.segments, getRoster(lesson.yearGroup));
}
