import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { compositeScore, LEVEL_NAMES, RUBRIC } from "../rubric";
import type { LessonAnalysis, TranscriptSegment } from "../types";
import { attachJudgements, pairExchanges } from "../exchanges";
import { computeMetrics, extractQuestions } from "./heuristic";

const MODEL = process.env.CADENCE_MODEL ?? "claude-opus-5";

const DimensionIds = z.enum(["questioning", "checking", "explanation", "retrieval", "feedback", "waitTime", "practice"]);

const AnalysisSchema = z.object({
  dimensions: z.array(
    z.object({
      id: DimensionIds,
      score: z.number().int().min(1).max(4),
      rationale: z.string(),
      evidence: z.array(z.object({ segmentId: z.string(), quote: z.string() })),
    }),
  ),
  questions: z.array(
    z.object({
      segmentId: z.string(),
      text: z.string(),
      type: z.enum(["closed", "open", "higher-order", "procedural", "rhetorical"]),
      target: z.enum(["cold-call", "hands-up", "unspecified"]),
    }),
  ),
  /** One entry per exchange listed in the user message, keyed by its exchangeId. */
  exchanges: z.array(
    z.object({
      exchangeId: z.string(),
      verdict: z.enum(["correct", "partial", "incorrect", "unclear"]),
      rationale: z.string(),
      misconception: z.object({ label: z.string(), quote: z.string() }).nullable(),
    }),
  ),
  strengths: z.array(z.string()),
  nextSteps: z.array(z.string()),
  summary: z.string(),
});

/** Cap on exchanges sent for judging, to keep output within max_tokens. The rest stay "unjudged". */
const MAX_JUDGED_EXCHANGES = 120;

const SYSTEM = `You are RELAY, an instructional coach that analyses classroom lesson transcripts against an evidence-based rubric.

Principles:
- Judge only what the transcript shows. Audio misses body language, board work, circulation and silent student work; when evidence is thin, say so in the rationale and score conservatively rather than guessing.
- Every score must be backed by verbatim quotes, referenced by segment id. Prefer 1–3 quotes per dimension.
- Be specific and actionable. Next steps should be concrete moves the teacher can try next lesson, phrased as something to say or do.
- Be honest and direct, not flattering. Teachers want accurate feedback.
- The transcript comes from speech-to-text and may contain recognition errors; don't penalise obvious transcription noise.

Rubric (score each 1–4: ${LEVEL_NAMES.join(", ")}):
${RUBRIC.map(
  (d) =>
    `## ${d.id} — ${d.name}\nWhy it matters: ${d.evidence}\n${d.levels.map((l, i) => `  ${i + 1}. ${l}`).join("\n")}`,
).join("\n\n")}

Also list every question the teacher asked, classified two ways:
- type: closed, open, higher-order, procedural (classroom management) or rhetorical — the cognitive demand of the question.
- target: who it was actually put to. This is independent of type and matters because a great open question still only checks the class if it reaches more than the confident volunteers:
  - "cold-call" — directed at a specific named student ("Jamal, what did your partner say?", "Explain why B is wrong, Priya.", or a bare nomination like "Amara?"). Per Doug Lemov (Teach Like a Champion), cold-calling is what forces a response from students who wouldn't otherwise raise a hand.
  - "hands-up" — explicitly opened to volunteers ("who can tell me...", "does anyone know...", "any volunteers?").
  - "unspecified" — put to the whole class with no explicit targeting signal either way.
  Per Rosenshine (2012) Principle 6, checking the responses of all students — not just those who put their hands up — is what separates real checking for understanding from the illusion of it. When scoring the "checking" dimension, weigh cold-calling as a genuine checking-for-understanding mechanism even if the teacher never says the words "cold call" out loud, and note in the rationale when questioning relies heavily on volunteers.

Student replies. The user message may list "exchanges": a teacher question paired (by speaker label and turn order) with the student speech that followed it. Judge each one in "exchanges", using its exchangeId:
- verdict: "correct", "partial" (right idea, incomplete or imprecise), "incorrect", or "unclear".
- Judge against what is being taught (subject, year group, lesson objective and the surrounding transcript), not against how fluent or confident the reply sounds.
- Use "unclear" whenever you cannot be sure: a fragment, garbled or inaudible speech-to-text, off-topic chatter, a reply to a procedural question, or when the transcript doesn't establish what a correct answer would be. Never mark "incorrect" on a guess.
- Set "misconception" only when the reply reveals a specific wrong idea, not merely a wrong number or a half-answer; otherwise null. "quote" must be copied word for word from the reply text. "label" is a short, reusable description of the wrong idea itself (for example "Adds numerators and denominators separately"), written about the idea and not about a student. If the idea matches one of the known labels you are given, reuse that label exactly, character for character; otherwise write a new one.
- Speakers are not identified. Never name, or guess, which student said something.

Return 2–3 strengths and 2–3 next steps, and a 2–3 sentence summary.`;

export function claudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export interface ClaudeAnalysisOptions {
  /** Misconception labels already on file for this class, offered for reuse so counts aggregate. */
  knownMisconceptions?: string[];
}

export async function claudeAnalysis(
  segments: TranscriptSegment[],
  context: string,
  options: ClaudeAnalysisOptions = {},
): Promise<LessonAnalysis> {
  const client = new Anthropic();

  // Measured metrics (timings, counts) are computed deterministically and handed to the model
  // so its judgement is anchored to facts it can't infer from text alone (e.g. pauses).
  const measuredQuestions = extractQuestions(segments);
  const metrics = computeMetrics(segments, measuredQuestions);

  const transcript = segments
    .map((s) => `[${s.id} ${fmt(s.start)}–${fmt(s.end)} ${s.speaker}] ${s.text}`)
    .join("\n");

  const pairing = pairExchanges(segments);
  const toJudge = pairing.exchanges.slice(0, MAX_JUDGED_EXCHANGES);
  const exchangeBlock = toJudge.length
    ? `\n\nExchanges to judge (JSON; reply text is verbatim from the transcript):\n${JSON.stringify(
        toJudge.map((e) => ({
          exchangeId: e.id,
          question: e.question,
          ...(e.nomination ? { nominatedStudentWith: e.nomination } : {}),
          reply: e.response,
          replySegmentIds: e.responseSegmentIds,
        })),
        null,
        2,
      )}`
    : "\n\nNo exchanges to judge: return an empty exchanges array.";
  const known = (options.knownMisconceptions ?? []).slice(0, 40);
  const knownBlock = known.length
    ? `\n\nKnown misconception labels for this class (reuse verbatim when the same idea appears):\n${known.map((k) => `- ${k}`).join("\n")}`
    : "";

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Lesson context: ${context}

Measured metrics (from timestamps — trust these over your own estimates):
${JSON.stringify(metrics, null, 2)}

Transcript:
${transcript}${exchangeBlock}${knownBlock}`,
      },
    ],
    output_config: { format: betaZodOutputFormat(AnalysisSchema) },
  });

  if (response.stop_reason === "refusal") throw new Error("Analysis declined by the model");
  const parsed = response.parsed_output;
  if (!parsed) throw new Error(`Unparseable analysis (stop_reason: ${response.stop_reason})`);

  const waitBySegment = new Map(measuredQuestions.map((q) => [q.segmentId + q.text, q.waitTime]));
  const lastWaitBySegment = new Map(measuredQuestions.map((q) => [q.segmentId, q.waitTime]));

  // Keep rubric order and guarantee every dimension exists.
  const dimensions = RUBRIC.map(
    (r) =>
      parsed.dimensions.find((d) => d.id === r.id) ?? {
        id: r.id,
        score: 1,
        rationale: "No evidence found in the transcript.",
        evidence: [],
      },
  );

  const judged = attachJudgements(toJudge, parsed.exchanges, segments);
  const unjudgedTail = pairing.exchanges.slice(MAX_JUDGED_EXCHANGES).map((e) => ({ ...e, verdict: "unjudged" as const }));
  const exchangeNote =
    pairing.note ??
    (unjudgedTail.length ? `Only the first ${MAX_JUDGED_EXCHANGES} of ${pairing.exchanges.length} exchanges were judged.` : undefined);

  return {
    engine: "claude",
    analysedAt: new Date().toISOString(),
    overall: compositeScore(dimensions),
    dimensions,
    exchanges: [...judged, ...unjudgedTail],
    ...(exchangeNote ? { exchangeNote } : {}),
    questions: parsed.questions.map((q) => ({
      ...q,
      waitTime: waitBySegment.get(q.segmentId + q.text) ?? lastWaitBySegment.get(q.segmentId) ?? null,
    })),
    metrics,
    strengths: parsed.strengths,
    nextSteps: parsed.nextSteps,
    summary: parsed.summary,
  };
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
