// Deterministic pairing of teacher questions with the student speech that answers them.
// This is the factual half of "what did students say?": no judgement happens here, only turn
// structure. Judging correctness and misconceptions is the Claude engine's job (analysis/claude.ts).
import { classifyQuestion, isQuestion, looksLikeName, splitSentences, THINK_TIME } from "./analysis/patterns";
import type { ReplyVerdict, StudentExchange, TranscriptSegment } from "./types";

/** A paired exchange before any verdict is attached. */
export type ExchangeCandidate = Omit<StudentExchange, "verdict" | "rationale" | "misconception">;

export interface PairingResult {
  exchanges: ExchangeCandidate[];
  /** Why nothing could be paired, when that is a property of the transcript rather than the lesson. */
  note?: string;
}

/**
 * A bare name ("Amara?") puts an earlier question to one student rather than asking a new one.
 * Only a single name-shaped word counts: "Everyone ready?" is a procedural check, not a nomination.
 */
const isNomination = (sentence: string) => {
  const words = sentence.trim().replace(/\?+$/, "").split(/\s+/);
  return words.length === 1 && looksLikeName(words[0]);
};

/** At most this many consecutive student segments are attributed to one question (choral/overlapping answers). */
const MAX_REPLY_SEGMENTS = 4;
/** How many teacher segments back we will look for the question a nomination refers to. */
const MAX_LOOKBACK = 3;

/** Index of the sentence in `sentences` that ends the teacher's turn as a question, or -1. */
function turnEndingQuestion(sentences: string[]): number {
  for (let j = sentences.length - 1; j >= 0; j--) {
    if (isQuestion(sentences[j])) return j;
    // Only a think-time cue may follow the question for it to still end the turn.
    if (!THINK_TIME.test(sentences[j])) return -1;
  }
  return -1;
}

const isSubstantive = (sentence: string) => {
  const type = classifyQuestion(sentence);
  return type !== "procedural" && type !== "rhetorical";
};

/** Walk back over teacher-only turns for the last substantive question (used for nominations). */
function findNominatedQuestion(
  segments: TranscriptSegment[],
  from: number,
): { segmentId: string; text: string } | null {
  let seen = 0;
  for (let i = from - 1; i >= 0 && seen < MAX_LOOKBACK; i--) {
    if (segments[i].speaker !== "teacher") return null; // a student (or unknown) turn intervenes
    seen++;
    const sentences = splitSentences(segments[i].text);
    for (let j = sentences.length - 1; j >= 0; j--) {
      if (isQuestion(sentences[j]) && isSubstantive(sentences[j])) {
        return { segmentId: segments[i].id, text: sentences[j] };
      }
    }
  }
  return null;
}

export function pairExchanges(segments: TranscriptSegment[]): PairingResult {
  const hasStudent = segments.some((s) => s.speaker === "student");
  const hasTeacher = segments.some((s) => s.speaker === "teacher");
  if (!hasStudent || !hasTeacher) {
    return {
      exchanges: [],
      note: hasStudent
        ? "No teacher speech was labelled, so replies cannot be matched to questions."
        : "No student speech was labelled in this transcript, so replies cannot be paired with questions.",
    };
  }

  const exchanges: ExchangeCandidate[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (seg.speaker !== "teacher" || segments[i + 1].speaker !== "student") continue;

    const sentences = splitSentences(seg.text);
    const j = turnEndingQuestion(sentences);
    if (j < 0) continue;

    let question = sentences[j];
    let questionSegmentId = seg.id;
    let nomination: string | undefined;
    if (isNomination(question)) {
      const prior = findNominatedQuestion(segments, i);
      if (!prior) continue; // a bare name with no question we can find to attach it to
      nomination = question;
      question = prior.text;
      questionSegmentId = prior.segmentId;
    } else if (!isSubstantive(question)) {
      continue; // "Everyone ready?" — a student murmuring back is not an answer to assess
    }

    const replies: TranscriptSegment[] = [];
    for (let k = i + 1; k < segments.length && segments[k].speaker === "student"; k++) replies.push(segments[k]);
    const used = replies.slice(0, MAX_REPLY_SEGMENTS);

    exchanges.push({
      id: `ex-${seg.id}-${j}`,
      questionSegmentId,
      question,
      ...(nomination ? { nomination } : {}),
      responseSegmentIds: used.map((r) => r.id),
      response: used.map((r) => r.text.trim()).join(" "),
    });
  }

  return {
    exchanges,
    note: exchanges.length ? undefined : "Student speech is present, but no question was directly followed by a reply.",
  };
}

/** Loose comparison so ASR spacing/punctuation/case differences don't defeat a verbatim check. */
export const looseText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * The reply segment a quote came from, or null if the quote isn't in the reply at all. A quote
 * that straddles two reply segments is attributed to the first of them.
 */
export function locateQuote(
  quote: string,
  exchange: Pick<ExchangeCandidate, "responseSegmentIds">,
  segments: TranscriptSegment[],
): string | null {
  const needle = looseText(quote);
  if (!needle) return null;
  const replies = exchange.responseSegmentIds
    .map((id) => segments.find((s) => s.id === id))
    .filter((s): s is TranscriptSegment => Boolean(s));
  for (const seg of replies) if (looseText(seg.text).includes(needle)) return seg.id;
  const joined = looseText(replies.map((s) => s.text).join(" "));
  return replies.length && joined.includes(needle) ? replies[0].id : null;
}

/** What the judging step returns for one exchange (validated against the schema in claude.ts). */
export interface ReplyJudgement {
  exchangeId: string;
  verdict: ReplyVerdict;
  rationale: string;
  misconception: { label: string; quote: string } | null;
}

const MAX_LABEL = 140;

/**
 * Attach judgements to paired exchanges. Every pair comes back; any the judge skipped stay
 * "unjudged" rather than being guessed. A misconception tag is kept only if it is consistent with
 * the verdict and its quote can be found in the student's actual words — otherwise the tag is
 * dropped (the verdict and rationale stay) so the app never displays an invented student quote.
 */
export function attachJudgements(
  candidates: ExchangeCandidate[],
  judgements: ReplyJudgement[],
  segments: TranscriptSegment[],
): StudentExchange[] {
  const byId = new Map<string, ReplyJudgement>();
  for (const j of judgements) if (!byId.has(j.exchangeId)) byId.set(j.exchangeId, j);

  return candidates.map((c) => {
    const j = byId.get(c.id);
    if (!j) return { ...c, verdict: "unjudged" as const };

    const out: StudentExchange = { ...c, verdict: j.verdict, rationale: j.rationale.trim() || undefined };
    const m = j.misconception;
    if (!m) return out;

    const label = m.label.trim().replace(/\s+/g, " ");
    const segmentId = locateQuote(m.quote, c, segments);
    const consistent = j.verdict === "partial" || j.verdict === "incorrect";
    if (label && label.length <= MAX_LABEL && consistent && segmentId) {
      out.misconception = { label, quote: m.quote.trim(), segmentId };
    } else {
      const why = !segmentId ? "quote not found in the reply" : !consistent ? "verdict was not partial/incorrect" : "invalid label";
      out.rationale = `${out.rationale ? out.rationale + " " : ""}(Misconception tag discarded: ${why}.)`;
    }
    return out;
  });
}
