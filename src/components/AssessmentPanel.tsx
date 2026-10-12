"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { triangulate } from "@/lib/triangulate";
import type { Assessment } from "@/lib/types";
import type { MisconceptionGroup } from "@/lib/misconceptions";
import { misconceptionGroupId } from "@/lib/misconceptions";
import { MisconceptionDetail } from "./MisconceptionDetail";
import { MisconceptionEvidenceEditor } from "./MisconceptionEvidenceEditor";
import { useFeedback } from "./Feedback";
const SAMPLE = `student,score,max\nAmara,8,10\nJamal,9,10\nPriya,6,10\nTom,4,10\nSofia,7,10`;
export function AssessmentPanel({
  lessonId,
  overall,
  assessment,
  yearGroup,
  groups = [],
}: {
  lessonId: string;
  overall: number | null;
  assessment: Assessment | null;
  yearGroup: string;
  groups?: MisconceptionGroup[];
}) {
  const router = useRouter(),
    notify = useFeedback(),
    fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState(""),
    [notes, setNotes] = useState(""),
    [kind, setKind] = useState<Assessment["kind"]>("exit-ticket"),
    [maximum, setMaximum] = useState(10),
    [threshold, setThreshold] = useState(70),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const classHref = `/misconceptions?class=${encodeURIComponent(yearGroup || "Unassigned")}`;
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/assessment`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          csv,
          defaultMax: maximum,
          masteryThreshold: threshold,
          misconceptions: notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      notify("Results saved — outcomes updated");
      setCsv("");
      setNotes("");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection failed. Your input is still here.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function clear() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/assessment`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove results");
      notify("Results removed — ready to upload again");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setBusy(false);
    }
  }
  const verdict =
    assessment && overall !== null
      ? triangulate(overall, assessment.masteryPct)
      : null;
  const pcts = assessment?.results.map((r) => (r.score / r.max) * 100) ?? [];
  const bins = [0, 20, 40, 60, 80].map(
      (lo) =>
        pcts.filter((p) => p >= lo && (lo === 80 ? p <= 100 : p < lo + 20))
          .length,
    ),
    maxBin = Math.max(1, ...bins);
  return (
    <div className="assessment-grid">
      <div className="glass p-[18px] min-w-0">
        {assessment ? (
          <>
            <div className="flex items-center gap-3 justify-between">
              <div className="eyebrow">
                {assessment.kind.replace("-", " ")} ·{" "}
                {assessment.results.length} students
              </div>
              <button
                aria-label="Remove results"
                title="Remove and re-upload"
                disabled={busy}
                onClick={clear}
                className="text-dim"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <b className="text-[30px] text-pink tabular-nums">
                  {assessment.masteryPct}%
                </b>
                <p className="text-[11px] text-muted">
                  reached mastery (≥{assessment.masteryThreshold}%)
                </p>
              </div>
              <div>
                <b className="text-[30px] tabular-nums">
                  {assessment.meanPct}%
                </b>
                <p className="text-[11px] text-muted">mean score</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {bins.map((n, i) => (
                <div key={i} className="flex-1 min-w-0 text-center">
                  <div className="h-10 flex items-end">
                    <div
                      className="w-full rounded-t-[3px]"
                      style={{
                        height: Math.max(n ? 4 : 2, (n / maxBin) * 40),
                        background: i >= 3 ? "var(--coral)" : "color-mix(in srgb, var(--coral) 35%, white)",
                      }}
                      title={`${i * 20}–${i === 4 ? 100 : i * 20 + 19}%: ${n} students`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-dim">
                    {i * 20}+
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 justify-between mt-5">
              <div className="eyebrow">Misconceptions</div>
              <Link href={classHref} className="text-[11px] text-cyan">
                See all for {yearGroup || "this class"} →
              </Link>
            </div>
            {assessment.misconceptions.length ? (
              assessment.misconceptions.map((m) => {
                const g = groups.find(
                  (g) => g.id === misconceptionGroupId(yearGroup, m.text),
                );
                return (
                  <details
                    key={m.id}
                    className="mt-2 border border-line rounded-lg p-3"
                  >
                    <summary className="text-[12.5px] cursor-pointer">
                      {m.text}
                      {m.studentCount !== undefined
                        ? ` · ${m.studentCount} reported`
                        : ""}
                    </summary>
                    {g && (
                      <div className="mt-3">
                        <MisconceptionDetail group={g} />
                      </div>
                    )}
                    <MisconceptionEvidenceEditor
                      lessonId={lessonId}
                      noteId={m.id}
                      students={assessment.results.map((r) => r.student)}
                    />
                  </details>
                );
              })
            ) : (
              <p className="text-xs text-muted mt-3">
                None noted for this assessment.
              </p>
            )}
            <details className="text-xs text-muted mt-4">
              <summary>Student scores</summary>
              <ul className="mt-2">
                {assessment.results.map((r) => (
                  <li key={r.student}>
                    {r.student} · {r.score}/{r.max}
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <>
            <div className="eyebrow mb-3">Upload exit-ticket results</div>
            <textarea
              aria-label="Assessment CSV"
              className="field font-mono text-xs"
              rows={5}
              placeholder={SAMPLE}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setCsv(await f.text());
              }}
            />
            <div className="flex gap-2 flex-wrap mt-3">
              <button
                className="btn btn-ghost !h-8 !px-3 !text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp size={14} />
                Choose CSV
              </button>
              <button
                className="btn btn-ghost !h-8 !px-3 !text-xs"
                onClick={() => setCsv(SAMPLE)}
              >
                Use sample
              </button>
              <button
                className="btn btn-primary !h-8 !px-3 !text-xs ml-auto"
                onClick={submit}
                disabled={!csv.trim() || busy}
              >
                {busy ? "Analysing results…" : "Upload & triangulate"}
              </button>
            </div>
            <label className="block text-xs text-muted mt-4">
              Misconceptions seen (optional, one per line)
              <textarea
                className="field font-mono text-xs mt-2"
                rows={3}
                placeholder={
                  "Changed a subscript instead of adding a coefficient x6\nConfuses mass and weight"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <details className="text-xs text-muted mt-3">
              <summary>Assessment settings</summary>
              <div className="grid gap-3 mt-3">
                <label>
                  Type
                  <select
                    className="field mt-1"
                    value={kind}
                    onChange={(e) =>
                      setKind(e.target.value as Assessment["kind"])
                    }
                  >
                    <option value="exit-ticket">Exit ticket</option>
                    <option value="worksheet">Worksheet</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </label>
                <label>
                  Maximum (when no max column)
                  <input
                    type="number"
                    min={1}
                    className="field mt-1"
                    value={maximum}
                    onChange={(e) => setMaximum(Number(e.target.value))}
                  />
                </label>
                <label>
                  Mastery threshold %
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="field mt-1"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  />
                </label>
              </div>
            </details>
          </>
        )}
        {error && (
          <p role="alert" className="text-xs text-red mt-3">
            {error}
          </p>
        )}
      </div>
      <div className="glass p-5 min-w-0">
        <div className="eyebrow">Triangulation</div>
        <h3 className="font-semibold text-[20px] mt-3">
          {verdict?.headline ??
            (assessment
              ? "Analyse this lesson to compare delivery"
              : "Upload an exit ticket to see this")}
        </h3>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">
          {verdict?.detail ??
            "Once results come in, Cadence checks whether what the delivery score found is showing up in what students can do."}
        </p>
        <Link href={classHref} className="block text-xs text-cyan mt-4">
          See misconceptions for {yearGroup || "this class"} →
        </Link>
        <p className="text-[11px] text-dim mt-6">
          One lesson is one data point. Patterns across lessons matter more than
          a single verdict.
        </p>
      </div>
    </div>
  );
}
