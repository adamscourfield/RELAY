"use client";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Check, Undo2, X } from "lucide-react";
import { formatClock } from "@/lib/transcript";
import type { BehaviourEvent, BehaviourType } from "@/lib/types";
import { useFeedback } from "./Feedback";
const META: Record<BehaviourType, { label: string; color: string }> = {
  merit: { label: "Merit", color: "var(--green)" },
  demerit: { label: "Demerit", color: "var(--amber)" },
  detention: { label: "Detention", color: "var(--red)" },
  "room-removal": { label: "Room removal", color: "var(--red)" },
};
export function BehaviourPanel({
  lessonId,
  events,
  roster,
  context,
  pendingOnly = false,
}: {
  lessonId: string;
  events: BehaviourEvent[];
  roster: string[];
  context?: string;
  pendingOnly?: boolean;
}) {
  const router = useRouter(),
    notify = useFeedback();
  const [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  async function update(e: BehaviourEvent, status: BehaviourEvent["status"]) {
    setBusy(e.id);
    setError("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/behaviour`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: e.id,
          status,
          studentMatch: choices[e.id] || e.studentMatch || undefined,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Could not update event");
      notify(
        status === "confirmed"
          ? "Approved — added to the confirmed tally"
          : status === "dismissed"
            ? "Denied — detection dismissed"
            : "Returned to review",
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Connection failed. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }
  const visible = pendingOnly
    ? events.filter((e) => e.status === "pending")
    : [...events].sort(
        (a, b) =>
          Number(b.status === "pending") - Number(a.status === "pending"),
      );
  if (!visible.length)
    return pendingOnly ? null : (
      <div className="glass p-5 text-sm text-muted">
        No merits or sanctions detected in this transcript.
      </div>
    );
  return (
    <>
      {error && (
        <p role="alert" className="text-red text-sm">
          {error}
        </p>
      )}
      {visible.map((e) => {
        const m = META[e.type],
          name =
            choices[e.id] || e.studentMatch || e.studentRaw || "Pick student";
        return (
          <article
            key={e.id}
            className={`glass review-card ${e.status === "dismissed" ? "opacity-50" : ""}`}
            style={{ "--event-color": m.color } as CSSProperties}
          >
            <div className="flex gap-3 items-center">
              <span className="review-avatar">
                {name
                  .split(/\s+/)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <b className="text-[14px]">{name}</b>
                <p className="text-xs text-muted">
                  {formatClock(e.at)}
                  {e.status !== "pending" && ` · ${e.status}`}
                </p>
              </div>
              <span className="review-event-label">{m.label}</span>
            </div>
            <p className="mt-3 text-[13px] text-muted leading-relaxed">
              “{e.quote}”
            </p>
            {context && (
              <Link
                href={`/lessons/${lessonId}`}
                className="block text-[11px] text-dim mt-3"
              >
                {context}
              </Link>
            )}
            {e.status === "pending" && !e.studentMatch && (
              <select
                aria-label={`Student for ${m.label} at ${formatClock(e.at)}`}
                className="field mt-3"
                value={choices[e.id] ?? ""}
                onChange={(ev) =>
                  setChoices({ ...choices, [e.id]: ev.target.value })
                }
              >
                <option value="">Pick student…</option>
                {roster.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            )}
            <div className="review-actions">
              {e.status === "pending" ? (
                <>
                  <button
                    className="btn btn-ghost review-approve"
                    disabled={
                      busy === e.id || !(choices[e.id] || e.studentMatch)
                    }
                    onClick={() => update(e, "confirmed")}
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    className="btn btn-ghost text-dim"
                    disabled={busy === e.id}
                    onClick={() => update(e, "dismissed")}
                  >
                    <X size={14} />
                    Deny
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-ghost"
                  disabled={busy === e.id}
                  onClick={() => update(e, "pending")}
                >
                  <Undo2 size={14} />
                  Undo
                </button>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}
