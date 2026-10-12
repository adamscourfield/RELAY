import { listLessons } from "@/lib/store";
import { dailyTally, schoolDay } from "@/lib/behaviour";
import { getRoster } from "@/lib/roster";
import { BehaviourPanel } from "@/components/BehaviourPanel";
import { EmptyState, PageHeader, Stat } from "@/components/ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Behaviour · RELAY" };
export default async function BehaviourPage() {
  const lessons = await listLessons(),
    tally = dailyTally(lessons, schoolDay());
  const pending = lessons.filter((l) =>
    l.behaviourEvents.some((e) => e.status === "pending"),
  );
  const count = pending.reduce(
    (n, l) =>
      n + l.behaviourEvents.filter((e) => e.status === "pending").length,
    0,
  );
  const merits = tally.reduce((n, r) => n + r.merit, 0),
    sanctions = tally.reduce(
      (n, r) => n + r.demerit + r.detention + r.roomRemoval,
      0,
    );
  const top = [...tally].sort(
    (a, b) => b.merit - a.merit || a.student.localeCompare(b.student),
  )[0];
  return (
    <>
      <PageHeader eyebrow="Behaviour" title="Praise and Sanctions" />
      <div className="overview-stats mb-6">
        <Stat
          label="Needs review"
          value={count}
          hint="detections to confirm"
          accent="var(--amber)"
        />
        <Stat
          label="Merits today"
          value={merits}
          hint="confirmed only"
          accent="var(--green)"
        />
        <Stat
          label="Sanctions today"
          value={sanctions}
          hint="demerits + detentions + removals"
          accent="var(--red)"
        />
        <Stat
          label="Top performer"
          value={top?.merit ? top.student : "—"}
          hint={top?.merit ? `${top.merit} merits` : "no merits yet"}
        />
      </div>
      <h2 className="text-[16px] font-semibold mb-3">Needs review</h2>
      <p className="text-xs text-muted mb-4">
        Detected from speech. Nothing counts until you approve the student and
        event.
      </p>
      {count ? (
        <div className="review-grid mb-6">
          {pending.map((l) => (
            <BehaviourPanel
              key={l.id}
              lessonId={l.id}
              events={l.behaviourEvents}
              roster={getRoster(l.yearGroup)}
              context={`${l.title} · ${l.subject} · ${l.yearGroup}`}
              pendingOnly
            />
          ))}
        </div>
      ) : (
        <EmptyState title="All caught up">
          No detections awaiting review.
        </EmptyState>
      )}
      <h2 className="text-[16px] font-semibold mt-6 mb-3">
        Today’s confirmed tally
      </h2>
      {tally.length ? (
        <div className="glass overflow-hidden">
          {tally.map((r) => (
            <div
              key={`${r.yearGroup}|${r.student}`}
              className="flex items-center flex-wrap gap-3 px-4 py-3 border-b border-line last:border-0"
            >
              <span
                className="review-avatar"
                style={{ background: "var(--well)", color: "var(--muted)" }}
              >
                {r.student
                  .split(/\s+/)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="flex-1 min-w-0">
                <b className="text-sm">{r.student}</b>
                <p className="text-xs text-dim">{r.yearGroup}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  [r.merit, "merit", "var(--green)"],
                  [r.demerit, "demerit", "var(--amber)"],
                  [r.detention, "detention", "var(--red)"],
                  [r.roomRemoval, "removal", "var(--red)"],
                ].map(
                  ([n, label, color]) =>
                    Number(n) > 0 && (
                      <span
                        key={String(label)}
                        className="chip"
                        style={{ color: String(color) }}
                      >
                        {n} {label}
                        {Number(n) !== 1 ? "s" : ""}
                      </span>
                    ),
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing confirmed today">
          Approvals for earlier lessons stay attached to those lesson dates.
        </EmptyState>
      )}
      <p className="text-xs text-dim mt-4">
        Demo roster · day boundary Europe/London. Real student records will come
        from the connected school roster.
      </p>
    </>
  );
}
