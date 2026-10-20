import "server-only";
import { groupMisconceptions, normalise } from "./misconceptions";
import { listLessons } from "./store";

/**
 * Misconception wording already on file for the same class and subject, most frequent first.
 * Offered to the judging step so the same idea keeps the same label and aggregates, instead of
 * fragmenting into near-duplicate phrasings (grouping is by exact normalised wording on purpose —
 * no fuzzy matching). Synthetic demo lessons are excluded so they can never seed labels for, or
 * merge with, evidence from real lessons; other subjects are excluded because their labels are noise.
 */
export async function knownMisconceptionLabels(yearGroup: string, subject: string, limit = 40): Promise<string[]> {
  const cls = normalise(yearGroup || "Unassigned");
  const subj = normalise(subject || "");
  const lessons = (await listLessons()).filter(
    (l) => l.source !== "demo" && normalise(l.yearGroup || "Unassigned") === cls && normalise(l.subject || "") === subj,
  );
  return groupMisconceptions(lessons)
    .sort((a, b) => b.reportedCount + b.heardCount - (a.reportedCount + a.heardCount))
    .slice(0, limit)
    .map((g) => g.text);
}
