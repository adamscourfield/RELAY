// Pure text-pattern helpers shared by the live coach (browser) and the heuristic engine (server).
import type { QuestionTarget, QuestionType } from "../types";

const HIGHER_ORDER =
  /\b(why|justify|evaluate|compare|contrast|predict|what if|what would happen|how do you know|convince|prove|what's the difference|which is better|agree or disagree|do you agree|explain why|how could we|what evidence)\b/i;
const OPEN = /^(how|why|explain|describe|what do you (think|notice|wonder)|tell me|talk to|in what way|what might)\b|\b(explain|describe|tell me more|what makes you say)\b/i;
const PROCEDURAL =
  /\b(can you (all )?(open|turn|get|put|pass|hear|see)|are you ready|have you got|is everyone (ready|finished)|shall we|can i have|who needs|any questions\??|everyone ok\??|does that make sense\??)$/i;
const RHETORICAL = /\b(isn't it|aren't they|don't we|right|yeah|ok|okay)\?$/i;

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isQuestion(sentence: string): boolean {
  const s = sentence.trim();
  if (s.endsWith("?")) return true;
  if (/[.!]$/.test(s)) return false;
  // Live speech-to-text often has no punctuation at all; fall back to interrogative openers.
  return /^(who|what|when|where|why|how|which|can you|could you|would you|do you|does anyone|is it|are there)\b/i.test(s) &&
    s.split(/\s+/).length >= 4;
}

export function classifyQuestion(q: string): QuestionType {
  const s = q.trim();
  // Bare nominations ("Amara?") are cold-call prompts, not new questions.
  if (PROCEDURAL.test(s) || s.split(/\s+/).length <= 2) return "procedural";
  if (HIGHER_ORDER.test(s)) return "higher-order";
  if (RHETORICAL.test(s) && s.split(/\s+/).length < 9) return "rhetorical";
  if (OPEN.test(s)) return "open";
  return "closed";
}

// ---- Question targeting: cold-call vs. hands-up (Lemov / Rosenshine Principle 6) ----
// Distinct from QuestionType above: type is about cognitive demand (open/closed/...), target is
// about *who* the teacher put it to. A teacher can ask a brilliant open question and still only
// ever direct it at volunteers — the rubric's "checking" dimension cites cold-calling specifically
// because naming a student is what forces a response from someone who didn't put their hand up.
const HANDS_UP = /\b(anyone|any volunteers|who can|who'd like|who knows|does anyone|hands up if|who thinks|who wants to)\b/i;
// A capitalised word immediately before/after the question, excluding common sentence openers
// that happen to be capitalised (start-of-sentence "So", "Right", politeness forms, etc).
const NOT_A_NAME = new Set([
  "I", "You", "We", "They", "So", "Now", "Right", "Okay", "Well", "What", "Why", "How", "Who",
  "When", "Where", "Which", "Can", "Could", "Would", "Do", "Does", "Is", "Are", "The", "This",
  "That", "Everyone", "Yes", "No", "Thank", "Thanks", "Miss", "Sir", "Mr", "Mrs", "Ms", "Good",
]);
export const looksLikeName = (word: string) => /^[A-Z][a-z]+$/.test(word) && !NOT_A_NAME.has(word);

/**
 * `roster`, when available, is the deciding factor: ordinary capitalised words ("Anyone?", "Six?",
 * a student's one-word answer echoed back) pass the bare `looksLikeName` shape check just as well
 * as a real name does, so without something to check against, a bare one-word "sentence" is too
 * unreliable to call a cold call — it's left "unspecified" rather than guessed. The comma-adjacent
 * patterns ("Jamal, what did...", "...wrong, Priya?") are a strong enough shape on their own to
 * keep even with no roster, since normal sentences don't address a name like that by accident.
 */
export function detectQuestionTarget(sentence: string, roster?: string[]): QuestionTarget {
  const s = sentence.trim();
  const rosterSet = roster ? new Set(roster.map((n) => n.toLowerCase())) : null;
  const isKnownName = (word: string) => looksLikeName(word) && (!rosterSet || rosterSet.has(word.toLowerCase()));

  const bare = s.replace(/\?+$/, "");
  if (rosterSet && bare.split(/\s+/).length === 1 && isKnownName(bare)) return "cold-call"; // "Amara?"
  const startMatch = s.match(/^([A-Z][a-z]+),\s/); // "Jamal, what did your partner say?"
  if (startMatch && isKnownName(startMatch[1])) return "cold-call";
  const endMatch = s.match(/,\s([A-Z][a-z]+)[?.!]*$/); // "Explain why B is wrong, Priya?"
  if (endMatch && isKnownName(endMatch[1])) return "cold-call";
  if (HANDS_UP.test(s)) return "hands-up";
  return "unspecified";
}

export const CFU =
  /\b(show me|boards up|whiteboards|mini[- ]?whiteboards|thumbs|fingers up|on three|hands down|everyone (write|show|hold)|turn and talk|tell your partner|cold call|hinge question|traffic lights?|fist to five|i'm going to pick|i'll choose someone|no hands)\b/i;
export const RETRIEVAL =
  /\b(last lesson|last week|yesterday|remember when|do you remember|can you remember|recap|retrieval|do now|quiz|what did we (learn|do)|flashback|recall)\b/i;
export const MODELLING =
  /\b(watch me|i'm going to show you|let me show|worked example|example|step (one|two|three|1|2|3)|first,? we|next,? we|then we|finally|notice how|i'm thinking|the reason i|success criteria|by the end of (the|this) lesson|learning (objective|intention)|we are learning to)\b/i;
export const PRACTICE =
  /\b(on your own|independently|have a go|your turn|you do|we do|together|try (this|the next|one)|in pairs|with your partner|complete (the|questions)|work through|practice)\b/i;
export const THINK_TIME = /\b(thinking time|think about it|take a moment|i'll give you|few seconds|pause|don't put your hand up yet)\b/i;
export const GENERIC_PRAISE = /^(good|great|well done|brilliant|excellent|nice|lovely|perfect|super|fantastic|good job|amazing|yes|correct|right)[.!]?$/i;
export const SPECIFIC_PRAISE =
  /\b(because you|i like (how|that) you|you('ve| have) (used|shown|explained|included)|that's (right|correct) because|notice how you|the reason that works|what you did well|next step|to improve|even better if)\b/i;

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
