export type Speaker = "teacher" | "student" | "unknown";

export interface TranscriptSegment {
  id: string;
  /** Seconds from lesson start. */
  start: number;
  end: number;
  speaker: Speaker;
  text: string;
  timing?: "measured" | "estimated";
}

export type QuestionType = "closed" | "open" | "higher-order" | "procedural" | "rhetorical";

/**
 * Who the question was actually aimed at — orthogonal to QuestionType (which captures cognitive
 * demand). "cold-call" names a specific student rather than opening the floor; per Lemov (Teach
 * Like a Champion) this is what makes a check-for-understanding sample the whole class rather
 * than just confident volunteers, which is Rosenshine's Principle 6 ("check the responses of all
 * students, not just those who initially raise their hands").
 */
export type QuestionTarget = "cold-call" | "hands-up" | "unspecified";

export interface ClassifiedQuestion {
  segmentId: string;
  text: string;
  type: QuestionType;
  target: QuestionTarget;
  /** Seconds between the question ending and the next utterance. null when unknowable. */
  waitTime: number | null;
}

export type DimensionId =
  | "questioning"
  | "checking"
  | "explanation"
  | "retrieval"
  | "feedback"
  | "waitTime"
  | "practice";

export interface DimensionScore {
  id: DimensionId;
  /** 1 (emerging) – 4 (exemplary). */
  score: number;
  rationale: string;
  evidence: { segmentId: string; quote: string }[];
}

export interface LessonMetrics {
  durationSec: number;
  teacherWords: number;
  studentWords: number;
  wordsPerMinute: number;
  /** % of words spoken by the teacher; null when speaker labels are unavailable. */
  teacherTalkPct: number | null;
  questionCount: number;
  questionsPerTenMin: number;
  openQuestionPct: number;
  /** % of substantive questions aimed at a named student rather than the whole class/volunteers. */
  coldCallPct: number;
  meanWaitTime: number | null;
  checksForUnderstanding: number;
  genericPraise: number;
  specificPraise: number;
}

export type ReplyVerdict = "correct" | "partial" | "incorrect" | "unclear";

/**
 * One teacher question and the student speech that directly followed it. Pairing is deterministic
 * (speaker labels + turn order); the verdict is a judgement made afterwards by the Claude engine.
 * Students are not identified — diarization separates teacher from student, not one pupil from
 * another — so nothing here attributes a reply to a named child.
 */
export interface StudentExchange {
  id: string;
  /** Segment containing the question text itself. */
  questionSegmentId: string;
  question: string;
  /** Set when the teacher then named a student with a bare nomination ("Amara?"). */
  nomination?: string;
  responseSegmentIds: string[];
  response: string;
  /** "unjudged": paired, but this engine cannot assess correctness. */
  verdict: ReplyVerdict | "unjudged";
  rationale?: string;
  /** A specific wrong idea the reply reveals. `quote` is verified to appear in `response`. */
  misconception?: { label: string; quote: string; segmentId: string };
}

export interface LessonAnalysis {
  engine: "claude" | "heuristic";
  analysedAt: string;
  /** 0–100 composite of dimension scores. */
  overall: number;
  dimensions: DimensionScore[];
  questions: ClassifiedQuestion[];
  /** Teacher question → student reply pairs. Absent on lessons analysed before this existed. */
  exchanges?: StudentExchange[];
  /** Why exchanges is empty or incomplete (e.g. no student speech was labelled). */
  exchangeNote?: string;
  metrics: LessonMetrics;
  strengths: string[];
  nextSteps: string[];
  summary: string;
}

export interface StudentResult {
  student: string;
  score: number;
  max: number;
}

export interface MisconceptionEvidence {
  student: string;
  answer: string;
  explanation: string;
  /** "transcript": a reply heard in the lesson recording and judged by the analysis engine. */
  provenance: "teacher" | "demo" | "transcript";
  /** Transcript evidence only: where the reply sits in the lesson, and what was asked. */
  segmentId?: string;
  question?: string;
}
export interface MisconceptionFollowUp { groupId:string; addressedAt:string|null; addressedObservations:string[]; }
export interface Misconception {
  id: string;
  text: string;
  /** How many students' answers reflected this, when the teacher noted a count. */
  studentCount?: number;
  evidence?: MisconceptionEvidence[];
  suggestedAction?: string;
}

export interface Assessment {
  kind: "exit-ticket" | "worksheet" | "assessment";
  uploadedAt: string;
  results: StudentResult[];
  /** Mean % score across students. */
  meanPct: number;
  /** % of students at or above the mastery threshold. */
  masteryPct: number;
  masteryThreshold: number;
  /** Wrong-answer patterns the teacher noted while marking. Empty until entered. */
  misconceptions: Misconception[];
}

export type BehaviourType = "merit" | "demerit" | "detention" | "room-removal";

export interface BehaviourEvent {
  id: string;
  type: BehaviourType;
  /** Seconds from lesson start. */
  at: number;
  segmentId: string;
  /** The sentence the trigger phrase was detected in. */
  quote: string;
  /** Name as heard in the transcript, before roster matching. Null if nothing nameable was found nearby. */
  studentRaw: string | null;
  /** Roster name this was resolved to, when the raw name matched exactly one student in the class. */
  studentMatch: string | null;
  /** Other roster names the raw name could equally have meant — surfaced so the teacher can pick. */
  candidates: string[];
  /** Detection always needs a human to confirm before it counts against a student's record. */
  status: "pending" | "confirmed" | "dismissed";
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  yearGroup: string;
  teacher: string;
  /** What students should know or be able to do by the end of the lesson. */
  objective?: string;
  date: string;
  source: "live" | "import" | "demo";
  segments: TranscriptSegment[];
  analysis: LessonAnalysis | null;
  assessment: Assessment | null;
  /** Merits/sanctions detected from the transcript. Empty until confirmed by the teacher. */
  behaviourEvents: BehaviourEvent[];
}

export type LessonSummary = Omit<Lesson, "segments">;
