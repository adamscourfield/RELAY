"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Target } from "lucide-react";
import type { MisconceptionGroup } from "@/lib/misconceptions";
import { useFeedback } from "./Feedback";
export function MisconceptionDetail({ group }: { group: MisconceptionGroup }) {
  const router = useRouter(),
    notify = useFeedback();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function address() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/misconceptions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          addressed: !group.addressed,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      notify(group.addressed ? "Returned to attention" : "Marked addressed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="mc-fix">
        <Target size={16} />
        <div>
          <b>Try this</b>
          <p className="mt-1">{group.suggestedAction}</p>
          <span className="text-[11px] text-dim">
            Teaching suggestion · verify against the recorded work
          </span>
        </div>
      </div>
      {group.evidence.length ? (
        group.evidence.map((e, i) => {
          const heard = e.provenance === "transcript";
          return (
            <div key={`${e.lessonId}-${e.student}-${i}`} className="mc-student">
              <span className="review-avatar">{heard ? "?" : e.student[0]}</span>
              <div className="min-w-0">
                <b>{heard ? "Heard in the lesson" : e.student}</b>
                {heard && e.question && (
                  <p className="mt-1 text-xs text-muted">Asked: {e.question}</p>
                )}
                <p className="mt-1 text-[13px]">“{e.answer}”</p>
                {e.explanation && (
                  <p className="mt-1 text-xs text-muted">
                    <b>Why it’s wrong: </b>
                    {e.explanation}
                  </p>
                )}
                <Link
                  className="text-[11px] text-dim"
                  href={
                    heard && e.segmentId
                      ? `/lessons/${e.lessonId}#seg-${e.segmentId}`
                      : `/lessons/${e.lessonId}#outcomes`
                  }
                >
                  {e.lessonTitle}
                  {heard && " · jump to the reply"}
                </Link>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-muted py-4">
          No individual answers recorded for this one.
        </p>
      )}
      {error && (
        <p role="alert" className="text-red text-xs">
          {error}
        </p>
      )}
      <button
        className="btn btn-ghost mt-4"
        style={{ color: group.addressed ? "var(--muted)" : "var(--green)" }}
        onClick={address}
        disabled={busy}
      >
        <Check size={14} />
        {busy
          ? "Saving…"
          : group.addressed
            ? "Addressed · reopen"
            : "Mark addressed"}
      </button>
    </>
  );
}
