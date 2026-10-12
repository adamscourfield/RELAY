"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AlertTriangle,
  Clapperboard,
  Mic,
  MicOff,
  ShieldCheck,
  Square,
  Zap,
} from "lucide-react";
import {
  CFU,
  classifyQuestion,
  detectQuestionTarget,
  isQuestion,
  splitSentences,
  THINK_TIME,
  wordCount,
} from "@/lib/analysis/patterns";
import { QTYPE_COLOR, TARGET_LABEL } from "@/lib/qtype";
import { getRoster } from "@/lib/roster";
import { demoScript } from "@/lib/seed";
import { formatClock } from "@/lib/transcript";
import type {
  QuestionTarget,
  QuestionType,
  TranscriptSegment,
} from "@/lib/types";
import { PageHeader } from "@/components/ui";

// ---- Minimal Web Speech API typings (not in lib.dom for all TS versions) ----
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SRCtor = new () => SpeechRecognitionLike;

function getRecognition(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Nudge {
  id: number;
  at: number;
  tone: "warn" | "good";
  text: string;
}

interface LiveQuestion {
  segId: string;
  text: string;
  type: QuestionType;
  target: QuestionTarget;
  askedAt: number;
  wait: number | null;
}

const noopSubscribe = () => () => {};
const nowMs = () => performance.now();

const NUDGE_COOLDOWN = 240; // seconds before the same nudge can fire again

export function LiveSession() {
  const router = useRouter();
  const [phase, setPhase] = useState<"setup" | "live" | "saving">("setup");
  const [mode, setMode] = useState<"mic" | "demo">("mic");
  const [meta, setMeta] = useState({
    title: "",
    subject: "",
    yearGroup: "",
    teacher: "",
    objective: "",
  });
  const [consent, setConsent] = useState(false);
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getRecognition() !== null,
    () => true,
  );
  const [error, setError] = useState<string | null>(null);

  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interim, setInterim] = useState("");
  const [clock, setClock] = useState(0);
  const [nudges, setNudges] = useState<Nudge[]>([]);

  const startRef = useRef(0);
  const clockRef = useRef(0);
  const pendingStartRef = useRef<number | null>(null);
  const pendingSpeakerRef = useRef<TranscriptSegment["speaker"]>("unknown");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [transcribing, setTranscribing] = useState(false);
  const liveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNudgeRef = useRef<Record<string, number>>({});
  const segIdRef = useRef(0);
  const wakeRef = useRef<{ release(): Promise<void> } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const segsRef = useRef<TranscriptSegment[]>([]);
  const interimRef = useRef("");
  const metaRef = useRef(meta);
  const savingRef = useRef(false);
  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  const showInterim = useCallback((text: string) => {
    interimRef.current = text;
    setInterim(text);
  }, []);

  const now = useCallback(() => clockRef.current, []);

  const pushSegment = useCallback(
    (
      text: string,
      start: number,
      end: number,
      speaker: TranscriptSegment["speaker"] = "unknown",
    ) => {
      const clean = text.trim();
      if (!clean) return;
      segIdRef.current += 1;
      const seg: TranscriptSegment = {
        id: `s${segIdRef.current}`,
        start: +start.toFixed(1),
        end: +end.toFixed(1),
        speaker,
        text: clean,
      };
      segsRef.current = [...segsRef.current, seg];
      setSegments(segsRef.current);
    },
    [],
  );

  useEffect(() => {
    const leaving = (event: BeforeUnloadEvent) => {
      if (liveRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leaving);
    return () => window.removeEventListener("beforeunload", leaving);
  }, []);
  // ---------- Derived live metrics ----------
  const roster = useMemo(() => getRoster(meta.yearGroup), [meta.yearGroup]);
  const live = useMemo(() => {
    const questions: LiveQuestion[] = [];
    let lastCfu = 0;
    let words = 0;
    let recentWords = 0;
    let thinkCues = 0;
    segments.forEach((s, i) => {
      if (s.speaker === "student") return;
      const wc = wordCount(s.text);
      words += wc;
      if (s.end > clock - 60) recentWords += wc;
      const sentences = splitSentences(s.text);
      sentences.forEach((sent, j) => {
        if (CFU.test(sent)) lastCfu = s.end;
        if (THINK_TIME.test(sent)) thinkCues++;
        if (!isQuestion(sent)) return;
        const isLast =
          j === sentences.length - 1 ||
          sentences.slice(j + 1).every((x) => THINK_TIME.test(x));
        const next = segments[i + 1];
        questions.push({
          segId: s.id,
          text: sent,
          type: classifyQuestion(sent),
          target: detectQuestionTarget(sent, roster),
          askedAt: s.end,
          wait: isLast ? (next ? Math.max(0, next.start - s.end) : null) : 0.5,
        });
      });
    });
    const substantive = questions.filter((q) => q.type !== "procedural");
    const open = substantive.filter(
      (q) => q.type === "open" || q.type === "higher-order",
    ).length;
    const coldCalls = questions.filter((q) => q.target === "cold-call").length;
    const waits = substantive
      .map((q) => q.wait)
      .filter((w): w is number => w !== null);
    const lastQ = substantive[substantive.length - 1];
    return {
      questions,
      substantive,
      openPct: substantive.length
        ? Math.round((open / substantive.length) * 100)
        : 0,
      coldCallPct: questions.length
        ? Math.round((coldCalls / questions.length) * 100)
        : 0,
      meanWait: waits.length
        ? waits.reduce((a, b) => a + b, 0) / waits.length
        : null,
      lastWait: lastQ?.wait ?? null,
      sinceQuestion: clock - (lastQ?.askedAt ?? 0),
      sinceCfu: clock - lastCfu,
      wpm: Math.round(recentWords / Math.min(1, Math.max(clock, 1) / 60)),
      words,
      thinkCues,
    };
  }, [segments, clock, roster]);

  // ---------- Real-time nudges ----------
  useEffect(() => {
    if (phase !== "live") return;
    const fire = (key: string, tone: Nudge["tone"], text: string) => {
      const last = lastNudgeRef.current[key];
      if (last !== undefined && clock - last < NUDGE_COOLDOWN) return;
      lastNudgeRef.current[key] = clock;
      setNudges((n) =>
        [{ id: Date.now() + Math.random(), at: clock, tone, text }, ...n].slice(
          0,
          6,
        ),
      );
      if (tone === "warn") navigator.vibrate?.(120);
    };
    if (clock > 300 && live.sinceQuestion > 480)
      fire(
        "noq",
        "warn",
        "8 minutes without a question. Hand it to the class.",
      );
    if (clock > 600 && live.sinceCfu > 720)
      fire(
        "cfu",
        "warn",
        "No whole-class check for 12 min. Mini-whiteboards or a hinge question?",
      );
    const last3 = live.substantive.slice(-3);
    if (last3.length === 3 && last3.every((q) => q.type === "closed"))
      fire(
        "closed",
        "warn",
        "Three closed questions in a row. Try “How do you know?”",
      );
    const last3w = last3
      .map((q) => q.wait)
      .filter((w): w is number => w !== null);
    if (last3w.length === 3 && last3w.every((w) => w < 1))
      fire(
        "wait",
        "warn",
        "You're answering fast. Count to three after asking.",
      );
    if (clock > 90 && live.wpm > 185)
      fire(
        "pace",
        "warn",
        `Pace is ${live.wpm} wpm. Slow down for the key idea.`,
      );
    const lastQ = live.substantive[live.substantive.length - 1];
    if (lastQ?.type === "higher-order" && (lastQ.wait ?? 0) >= 3)
      fire(
        `ho-${lastQ.segId}`,
        "good",
        "Great — a reasoning question with real thinking time.",
      );
    const last6 = live.substantive.slice(-6);
    if (last6.length === 6 && last6.every((q) => q.target !== "cold-call")) {
      fire(
        "coldcall",
        "warn",
        "Six questions to the room, none to a named student. Try a cold call to check someone who hasn't volunteered.",
      );
    }
    if (
      lastQ?.target === "cold-call" &&
      live.substantive.slice(-4, -1).every((q) => q.target !== "cold-call")
    ) {
      fire(
        `cc-${lastQ.segId}`,
        "good",
        "Good cold call — that samples beyond the usual hands.",
      );
    }
  }, [clock, live, phase]);

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [segments, interim]);

  // ---------- Audio visualiser ----------
  const startVisualiser = useCallback((stream: MediaStream | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d")!;
    let analyser: AnalyserNode | null = null;
    if (stream) {
      const ac = new AudioContext();
      audioContextRef.current = ac;
      analyser = ac.createAnalyser();
      analyser.fftSize = 128;
      ac.createMediaStreamSource(stream).connect(analyser);
    }
    const data = new Uint8Array(64);
    const draw = (t: number) => {
      const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
      const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
      ctx2d.clearRect(0, 0, w, h);
      if (analyser) analyser.getByteFrequencyData(data);
      else
        for (let i = 0; i < data.length; i++)
          data[i] =
            pendingStartRef.current !== null
              ? 90 + 80 * Math.abs(Math.sin(t / 180 + i * 0.6)) * Math.random()
              : 8;
      const bars = 48;
      const bw = w / bars;
      const grad = ctx2d.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue("--coral").trim());
      grad.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue("--navy").trim());
      ctx2d.fillStyle = grad;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * 40)] / 255;
        const bh = Math.max(3 * devicePixelRatio, v * h * 0.9);
        ctx2d.globalAlpha = 0.35 + v * 0.65;
        ctx2d.beginPath();
        ctx2d.roundRect(i * bw + bw * 0.2, (h - bh) / 2, bw * 0.6, bh, bw);
        ctx2d.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  // ---------- Start / stop ----------
  async function start() {
    if (!meta.objective.trim() || !meta.yearGroup || !consent) return;
    setError(null);
    segsRef.current = [];
    savingRef.current = false;
    setSegments([]);
    setNudges([]);
    showInterim("");
    segIdRef.current = 0;
    lastNudgeRef.current = {};
    clockRef.current = 0;
    setClock(0);
    liveRef.current = true;
    setPhase("live");
    // The setup form can be scrolled a fair way down (e.g. behind a mobile sticky header);
    // jump back to the top so the recording UI isn't partly hidden underneath it.
    window.scrollTo({ top: 0 });
    try {
      wakeRef.current =
        (await (
          navigator as unknown as {
            wakeLock?: {
              request(t: "screen"): Promise<{ release(): Promise<void> }>;
            };
          }
        ).wakeLock?.request("screen")) ?? null;
    } catch {
      /* wake lock is best-effort */
    }

    if (mode === "demo") {
      runDemo();
      return;
    }

    const Rec = getRecognition();
    if (!Rec) {
      teardown();
      setPhase("setup");
      setError("Speech recognition is unavailable. Choose Demo lesson.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setError(
        "Microphone access was blocked. Allow the mic in your browser settings and try again.",
      );
      liveRef.current = false;
      setPhase("setup");
      return;
    }
    startRef.current = nowMs();
    const tick = (timerRef.current = setInterval(() => {
      if (!liveRef.current) return clearInterval(tick);
      clockRef.current = (nowMs() - startRef.current) / 1000;
      setClock(clockRef.current);
    }, 250));
    startVisualiser(streamRef.current);
    audioChunksRef.current = [];
    try {
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const mediaRec = new MediaRecorder(
        streamRef.current,
        mimeType ? { mimeType } : undefined,
      );
      mediaRec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRec.start(1000);
      mediaRecRef.current = mediaRec;
    } catch {
      // Recording the audio itself is a bonus (enables accurate diarized transcription on
      // stop); if it fails, live coaching still works off the browser's own speech engine.
    }

    const rec = new Rec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-GB";
    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (pendingStartRef.current === null)
          pendingStartRef.current = Math.max(0, now() - 0.6);
        if (r.isFinal) {
          pushSegment(r[0].transcript, pendingStartRef.current, now());
          pendingStartRef.current = null;
        } else interimText += r[0].transcript;
      }
      showInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError(
          "Speech recognition isn't permitted in this browser. Try Chrome or Edge, or use demo mode.",
        );
        teardown();
      }
    };
    // Browsers end recognition after silence; keep it alive for the whole lesson.
    rec.onend = () => {
      if (liveRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      teardown();
      setPhase("setup");
      setError("Speech recognition could not start. Try Demo lesson.");
    }
  }

  function runDemo() {
    const script = demoScript();
    let idx = 0;
    startVisualiser(null);
    const iv = (timerRef.current = setInterval(() => {
      if (!liveRef.current) return clearInterval(iv);
      const next = script[idx];
      // Fast-forward through long silences (independent work) so the demo stays watchable.
      const inSpeech = next && clockRef.current >= next.start;
      const gapAhead = next ? next.start - clockRef.current : 0;
      clockRef.current += inSpeech ? 0.25 : gapAhead > 20 ? 12 : 0.6;
      setClock(clockRef.current);
      if (!next) return;
      if (clockRef.current >= next.start) {
        pendingStartRef.current = next.start;
        pendingSpeakerRef.current = next.speaker;
        const progress = Math.min(
          1,
          (clockRef.current - next.start) /
            Math.max(0.5, next.end - next.start),
        );
        const words = next.text.split(" ");
        showInterim(
          words.slice(0, Math.ceil(words.length * progress)).join(" "),
        );
        if (clockRef.current >= next.end) {
          pushSegment(next.text, next.start, next.end, next.speaker);
          pendingStartRef.current = null;
          showInterim("");
          idx++;
          if (idx >= script.length) setTimeout(() => stop(), 1500);
        }
      }
    }, 100));
  }

  function teardown() {
    liveRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    recRef.current?.stop();
    recRef.current = null;
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive")
      mediaRecRef.current.stop();
    mediaRecRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
    wakeRef.current?.release().catch(() => undefined);
    wakeRef.current = null;
  }

  useEffect(() => () => teardown(), []);

  async function stop() {
    if (savingRef.current) return;
    savingRef.current = true;
    // Flush any in-flight utterance.
    const tail = interimRef.current.trim();
    const tailStart = pendingStartRef.current;
    const chunks = audioChunksRef.current;
    const mimeType = mediaRecRef.current?.mimeType;
    const recorder = mediaRecRef.current;
    const recorderStopped =
      recorder && recorder.state !== "inactive"
        ? new Promise<void>((resolve) =>
            recorder.addEventListener("stop", () => resolve(), { once: true }),
          )
        : Promise.resolve();
    teardown();
    await recorderStopped;
    if (tail && tailStart !== null)
      pushSegment(
        tail,
        tailStart,
        clockRef.current,
        mode === "demo" ? pendingSpeakerRef.current : "unknown",
      );
    showInterim("");
    let finalSegments = segsRef.current;
    if (!finalSegments.length) {
      savingRef.current = false;
      setError("Nothing was transcribed. Check the microphone and try again.");
      setPhase("setup");
      return;
    }

    // The browser's live speech recognition is good enough to coach from in the moment, but
    // it can't tell teacher from student. If we recorded the audio, re-transcribe it properly
    // (with speaker diarization) for the saved lesson — falling back to the live transcript
    // if that isn't configured or fails, so a missing API key never blocks saving a lesson.
    if (chunks.length && mode === "mic") {
      setTranscribing(true);
      try {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "lesson.webm");
        const tres = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        if (tres.ok) {
          const { segments: diarized } = await tres.json();
          if (diarized?.length) finalSegments = diarized;
        }
      } catch {
        // Keep the live-transcribed segments.
      }
      setTranscribing(false);
    }

    const meta = metaRef.current;
    setPhase("saving");
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title:
            meta.title || `Lesson ${new Date().toLocaleDateString("en-GB")}`,
          subject: meta.subject || "General",
          yearGroup: meta.yearGroup,
          teacher: meta.teacher || "Me",
          objective: meta.objective || undefined,
          source: mode === "demo" ? "demo" : "live",
          segments: finalSegments,
        }),
      });
      if (!res.ok) {
        savingRef.current = false;
        setError(
          "Couldn't save the lesson. Your transcript is still on screen — copy it before leaving.",
        );
        setPhase("live");
        return;
      }
      const { id } = await res.json();
      router.push(`/lessons/${id}`);
    } catch {
      savingRef.current = false;
      setPhase("live");
      setError(
        "Connection failed. Your transcript is still available; try End & analyse again.",
      );
    }
  }

  // ---------- Render ----------
  if (phase === "setup") {
    return (
      <>
        <PageHeader
          eyebrow="Live"
          title={
            <>
              Teaching, <span className="glow-text">heard clearly.</span>
            </>
          }
        />
        <div className="grid grid-cols-1 min-[861px]:grid-cols-[1fr_380px] gap-4 rise">
          <div className="glass p-6">
            <div className="eyebrow">Lesson details</div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <input
                className="field sm:col-span-2"
                placeholder="Lesson title — e.g. Adding fractions"
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              />
              <input
                className="field sm:col-span-2"
                placeholder="Lesson objective — e.g. Add fractions with different denominators"
                value={meta.objective}
                onChange={(e) =>
                  setMeta({ ...meta, objective: e.target.value })
                }
              />
              <select
                aria-label="Class"
                className="field sm:col-span-2"
                value={
                  meta.yearGroup ? `${meta.yearGroup}|${meta.subject}` : ""
                }
                onChange={(e) => {
                  const [yearGroup, subject] = e.target.value.split("|");
                  setMeta({ ...meta, yearGroup, subject });
                }}
              >
                <option value="" disabled>
                  Pick your class…
                </option>
                {[
                  "Year 7|Maths",
                  "Year 8|Maths",
                  "Year 9|Science",
                  "Year 10|History",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value.replace("|", " · ")}
                  </option>
                ))}
              </select>
              <details className="sm:col-span-2 text-xs text-muted">
                <summary>Teacher details</summary>
                <input
                  aria-label="Teacher"
                  className="field mt-2"
                  placeholder="Teacher"
                  value={meta.teacher}
                  onChange={(e) =>
                    setMeta({ ...meta, teacher: e.target.value })
                  }
                />
              </details>
            </div>

            <div className="eyebrow mt-8">Input</div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <ModeCard
                active={mode === "mic"}
                onClick={() => setMode("mic")}
                icon={<Mic size={18} />}
                title="Microphone"
                body="Live transcription in the browser. Best with a lapel or headset mic."
              />
              <ModeCard
                active={mode === "demo"}
                onClick={() => setMode("demo")}
                icon={<Clapperboard size={18} />}
                title="Demo lesson"
                body="Play a scripted lesson to see the live coach — no mic needed."
              />
            </div>
            {mode === "mic" && !supported && (
              <div className="mt-4 flex gap-3 text-sm rounded-xl p-3 border border-amber/30 bg-amber/5 text-amber">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                This browser has no built-in speech recognition. Use Chrome or
                Edge, run the demo, or import a transcript from your recorder.
              </div>
            )}

            <label className="mt-8 flex gap-3 items-start text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-[var(--cyan)]"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="text-muted">
                I&apos;ve told the class this lesson is being transcribed, in
                line with my school&apos;s recording and data-protection policy.
              </span>
            </label>
            {error && <div className="mt-4 text-sm text-red">{error}</div>}
            <button
              className="btn btn-primary mt-6 w-full sm:w-auto"
              disabled={
                !meta.objective.trim() ||
                !meta.yearGroup ||
                !consent ||
                (mode === "mic" && !supported)
              }
              onClick={start}
            >
              <Zap size={16} /> Start {mode === "demo" ? "demo" : "lesson"}
            </button>
          </div>

          <div className="glass p-6 flex flex-col gap-4 text-sm">
            <div className="eyebrow flex items-center gap-2">
              <ShieldCheck size={12} className="text-lime" /> How RELAY
              listens
            </div>
            <Point title="Transcript, not audio">
              Live speech recognition provides the coaching transcript. Recorded
              audio may be sent for diarized transcription on stop; RELAY
              stores the resulting text, not the audio.
            </Point>
            <Point title="Live nudges">
              Discreet prompts when patterns drift — long talk without
              questions, no checks for understanding, rushing past wait time.
            </Point>
            <Point title="Full report on stop">
              Every question classified, rubric scores with quoted evidence, and
              next steps.
            </Point>
            <Point title="Close the loop">
              Upload the exit ticket afterwards to see whether it landed.
            </Point>
          </div>
        </div>
      </>
    );
  }

  const nudgeActive = nudges[0] && clock - nudges[0].at < 20 ? nudges[0] : null;
  const busyLabel = transcribing
    ? "Transcribing…"
    : phase === "saving"
      ? "Analysing…"
      : null;

  const classLabel = [meta.yearGroup, meta.subject].filter(Boolean).join(" · ");

  return (
    <>
      <span
        hidden
        data-cadence-recording={phase === "live" && !error ? "true" : "false"}
      />
      <div className="hidden min-[861px]:block">
        <PageHeader
          eyebrow={classLabel || "Live"}
          title={
            meta.objective || (
              <>
                Teaching, <span className="glow-text">heard clearly.</span>
              </>
            )
          }
        />
      </div>

      {/* Mobile: stripped down to what matters while you're teaching — time, questions, nudges. */}
      <div className="min-[861px]:hidden flex flex-col items-center gap-6 pt-2 pb-4">
        <div className="w-full text-center px-2">
          <div className="eyebrow">
            {classLabel || (mode === "demo" ? "Demo lesson" : "Live lesson")}
          </div>
          <div className="mt-1.5 text-[15px] font-medium leading-snug">
            {meta.objective || (
              <span className="text-dim font-normal italic">
                No lesson objective set
              </span>
            )}
          </div>
          {mode === "demo" && (
            <div className="mt-1 text-[11px] text-dim">
              Demo · fast-forwarding silences
            </div>
          )}
        </div>

        <div className="w-full min-h-[52px] flex items-center">
          {nudgeActive && (
            <div
              key={nudgeActive.id}
              className="rise w-full rounded-2xl px-4 py-3 border text-sm font-medium flex items-center gap-3"
              style={{
                borderColor:
                  nudgeActive.tone === "warn"
                    ? "color-mix(in srgb, var(--amber) 40%, transparent)"
                    : "color-mix(in srgb, var(--lime) 40%, transparent)",
                background:
                  nudgeActive.tone === "warn"
                    ? "color-mix(in srgb, var(--amber) 8%, white)"
                    : "color-mix(in srgb, var(--lime) 8%, white)",
                color:
                  nudgeActive.tone === "warn" ? "var(--amber)" : "var(--lime)",
              }}
            >
              <Zap size={16} className="shrink-0" /> {nudgeActive.text}
            </div>
          )}
        </div>
        {error && (
          <div className="text-sm text-red flex items-center gap-2">
            <MicOff size={14} /> {error}
          </div>
        )}

        <div className="py-2">
          <CircularTimer
            clock={clock}
            onStop={stop}
            disabled={phase === "saving" || transcribing}
            busyLabel={busyLabel}
          />
        </div>

        <div className="text-center">
          <div className="text-4xl font-semibold tabular-nums">
            {live.substantive.length}
          </div>
          <div className="eyebrow mt-1.5">
            {live.substantive.length === 1
              ? "question asked"
              : "questions asked"}
          </div>
        </div>

        <div className="glass w-full p-4 h-36 flex flex-col">
          <div className="eyebrow mb-2.5 shrink-0">Transcript</div>
          <div className="flex-1 flex flex-col justify-end gap-2 overflow-hidden">
            {segments.length === 0 && !interim && (
              <div className="text-muted text-sm">
                Listening… start teaching.
              </div>
            )}
            {segments.slice(-4).map((s, i, arr) => (
              <div
                key={s.id}
                className="text-sm leading-snug truncate"
                style={{ opacity: 0.15 + (0.85 * (i + 1)) / arr.length }}
              >
                {s.text}
              </div>
            ))}
            {interim && (
              <div className="text-sm leading-snug truncate italic text-muted">
                {interim}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <details className="glass p-4 mb-4">
          <summary>Copy transcript before leaving</summary>
          <textarea
            aria-label="Recovered transcript"
            className="field mt-3 font-mono text-xs"
            rows={8}
            readOnly
            value={segments
              .map((s) => `[${formatClock(s.start)}] ${s.text}`)
              .join("\n")}
          />
        </details>
      )}
      {/* Desktop: full instrument panel. */}
      <div className="hidden min-[861px]:grid min-[861px]:grid-cols-[1fr_340px] min-[861px]:gap-4">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="glass p-5 flex items-center gap-5">
            <div className="relative size-12 shrink-0 grid place-items-center rounded-full bg-red/15 pulse-ring">
              <span className="size-3 rounded-full bg-red shadow-[0_0_12px_var(--red)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="eyebrow">
                {mode === "demo"
                  ? "Demo · fast-forwarding silences"
                  : "Recording"}
              </div>
              <div className="text-3xl font-mono font-medium tabular-nums">
                {formatClock(clock)}
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="hidden sm:block h-12 flex-1 max-w-xs"
            />
            <button
              className="btn btn-ghost !border-red/40 !text-red"
              onClick={stop}
              disabled={phase === "saving" || transcribing}
            >
              {transcribing ? (
                "Transcribing…"
              ) : phase === "saving" ? (
                "Analysing…"
              ) : (
                <>
                  <Square size={14} fill="currentColor" /> End &amp; analyse
                </>
              )}
            </button>
          </div>

          {nudgeActive && (
            <div
              key={nudgeActive.id}
              className="rise rounded-2xl px-5 py-4 border text-sm font-medium flex items-center gap-3"
              style={{
                borderColor:
                  nudgeActive.tone === "warn"
                    ? "color-mix(in srgb, var(--amber) 40%, transparent)"
                    : "color-mix(in srgb, var(--lime) 40%, transparent)",
                background:
                  nudgeActive.tone === "warn"
                    ? "color-mix(in srgb, var(--amber) 8%, white)"
                    : "color-mix(in srgb, var(--lime) 8%, white)",
                color:
                  nudgeActive.tone === "warn" ? "var(--amber)" : "var(--lime)",
              }}
            >
              <Zap size={16} /> {nudgeActive.text}
            </div>
          )}

          {error && (
            <div className="text-sm text-red flex items-center gap-2">
              <MicOff size={14} /> {error}
            </div>
          )}

          <div className="glass flex flex-col min-h-[420px] max-h-[62vh]">
            <div className="px-5 pt-4 pb-2 eyebrow">Live transcript</div>
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-3"
            >
              {segments.length === 0 && !interim && (
                <div className="text-muted text-sm">
                  Listening… start teaching.
                </div>
              )}
              {segments.map((s) => {
                const qs = live.questions.filter((q) => q.segId === s.id);
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-[44px_1fr] gap-3 rise"
                  >
                    <span className="font-mono text-[11px] text-dim pt-1">
                      {formatClock(s.start)}
                    </span>
                    <div className="text-[15px] leading-relaxed">
                      {s.text}
                      {qs.map((q, i) => (
                        <span
                          key={i}
                          className="chip ml-2 align-middle"
                          style={{
                            color: QTYPE_COLOR[q.type],
                            borderColor: "currentColor",
                          }}
                        >
                          {q.type}
                          {TARGET_LABEL[q.target] &&
                            ` · ${TARGET_LABEL[q.target]}`}
                          {q.wait !== null && ` · ${q.wait.toFixed(1)}s`}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {interim && (
                <div className="grid grid-cols-[44px_1fr] gap-3">
                  <span className="font-mono text-[11px] text-dim pt-1">…</span>
                  <div className="text-[15px] leading-relaxed text-muted italic">
                    {interim}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="glass p-5 grid grid-cols-2 gap-5">
            <Gauge
              label="Questions"
              value={`${live.substantive.length}`}
              sub={`${live.openPct}% open`}
              color="var(--cyan)"
            />
            <Gauge
              label="Cold calls"
              value={`${live.coldCallPct}%`}
              sub="named a student"
              color={
                live.substantive.length >= 6 && live.coldCallPct === 0
                  ? "var(--amber)"
                  : undefined
              }
            />
            <Gauge
              label="Wait time"
              value={
                live.meanWait === null ? "—" : `${live.meanWait.toFixed(1)}s`
              }
              sub="mean · target 3s"
              color={
                live.meanWait === null
                  ? undefined
                  : live.meanWait >= 3
                    ? "var(--lime)"
                    : live.meanWait >= 1.5
                      ? "var(--amber)"
                      : "var(--red)"
              }
            />
            <Gauge
              label="Since last question"
              value={formatClock(Math.max(0, live.sinceQuestion))}
              color={live.sinceQuestion > 480 ? "var(--amber)" : undefined}
            />
            <Gauge
              label="Since last check"
              value={formatClock(Math.max(0, live.sinceCfu))}
              color={live.sinceCfu > 720 ? "var(--amber)" : undefined}
            />
            <Gauge
              label="Pace"
              value={`${clock > 20 ? live.wpm : 0}`}
              sub="words / min"
              color={live.wpm > 185 ? "var(--amber)" : undefined}
            />
            <Gauge
              label="Words"
              value={`${live.words}`}
              sub={`${live.thinkCues} think-time cues`}
            />
          </div>

          <div className="glass p-5">
            <div className="eyebrow">Question mix</div>
            <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-track">
              {(
                [
                  "higher-order",
                  "open",
                  "closed",
                  "rhetorical",
                ] as QuestionType[]
              ).map((t) => {
                const n = live.substantive.filter((q) => q.type === t).length;
                return n ? (
                  <span
                    key={t}
                    style={{ flex: n, background: QTYPE_COLOR[t] }}
                  />
                ) : null;
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
              {(
                [
                  "higher-order",
                  "open",
                  "closed",
                  "rhetorical",
                ] as QuestionType[]
              ).map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: QTYPE_COLOR[t] }}
                  />
                  {t} {live.substantive.filter((q) => q.type === t).length}
                </span>
              ))}
            </div>
          </div>

          <div className="glass p-5 flex-1">
            <div className="eyebrow">Coach feed</div>
            <div className="mt-3 flex flex-col gap-2">
              {nudges.length === 0 && (
                <div className="text-sm text-muted">
                  Nudges appear here as the lesson unfolds.
                </div>
              )}
              {nudges.map((n) => (
                <div key={n.id} className="text-sm flex gap-2">
                  <span className="font-mono text-[11px] text-dim pt-0.5 w-10 shrink-0">
                    {formatClock(n.at)}
                  </span>
                  <span
                    style={{
                      color: n.tone === "warn" ? "var(--amber)" : "var(--lime)",
                    }}
                  >
                    {n.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function CircularTimer({
  clock,
  onStop,
  disabled,
  busyLabel,
}: {
  clock: number;
  onStop: () => void;
  disabled: boolean;
  busyLabel: string | null;
}) {
  const size = 216;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sweep = (clock % 60) / 60;
  const offset = c * (1 - sweep);
  return (
    <button
      onClick={onStop}
      disabled={disabled}
      aria-label="End lesson and analyse"
      className="relative mx-auto grid place-items-center shrink-0 rounded-full overflow-hidden disabled:opacity-70"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--violet)" />
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
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <span className="absolute inset-3 rounded-full bg-red/10 pulse-ring" />
      <span
        className="relative flex flex-col items-center justify-center gap-1.5 rounded-full bg-panel-strong border border-line shadow-[0_10px_36px_-14px_rgba(15,23,42,0.4)]"
        style={{ width: size - 56, height: size - 56 }}
      >
        {busyLabel ? (
          <span className="text-sm font-medium text-muted px-2 text-center">
            {busyLabel}
          </span>
        ) : (
          <>
            <Square size={20} className="text-red" fill="currentColor" />
            <span className="text-[26px] font-mono font-semibold tabular-nums leading-none">
              {formatClock(clock)}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-dim">
              Tap to end
            </span>
          </>
        )}
      </span>
    </button>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg p-4 border transition-all ${active ? "border-[var(--ink)]/40 bg-well" : "border-line bg-panel hover:border-line-strong"}`}
    >
      <div className={active ? "text-ink" : "text-muted"}>{icon}</div>
      <div className="mt-2 font-medium text-sm">{title}</div>
      <div className="mt-1 text-xs text-muted leading-relaxed">{body}</div>
    </button>
  );
}

function Point({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-medium">{title}</div>
      <div className="text-muted mt-0.5 leading-relaxed">{children}</div>
    </div>
  );
}

function Gauge({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="eyebrow !text-[10px] truncate">{label}</div>
      <div
        className="mt-1 text-2xl font-semibold font-mono tabular-nums transition-colors"
        style={{ color }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-dim truncate">{sub}</div>}
    </div>
  );
}
