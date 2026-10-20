"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { groupInstances, type MisconceptionGroup } from "@/lib/misconceptions";
import { MisconceptionDetail } from "./MisconceptionDetail";
import { Stat, EmptyState } from "./ui";
export function MisconceptionsWorkspace({
  groups,
}: {
  groups: MisconceptionGroup[];
}) {
  const router = useRouter(),
    params = useSearchParams(),
    filter = params.get("class") ?? "all";
  const classes = [...new Set(groups.map((g) => g.yearGroup))];
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    origin = useRef<HTMLElement | null>(null);
  const group = groups.find((g) => g.id === selected);
  const hasGroup = Boolean(group);
  useEffect(() => {
    if (!hasGroup) return;
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.close();
      document.body.style.overflow = prev;
      origin.current?.focus();
    };
  }, [selected, hasGroup]);
  const active = groups.filter((g) => !g.addressed);
  const attention = classes
    .map((c) => ({
      name: c,
      count: active
        .filter((g) => g.yearGroup === c)
        .reduce((n, g) => n + groupInstances(g), 0),
    }))
    .sort((a, b) => b.count - a.count)[0];
  return (
    <>
      <div className="overview-stats mb-6">
        <Stat
          label="Misconceptions"
          value={groups.length}
          hint="distinct patterns tracked"
        />
        <Stat
          label="Reported instances"
          value={groups.reduce((n, g) => n + groupInstances(g), 0)}
          hint="teacher-reported plus heard in lessons"
          accent="var(--heading-accent)"
        />
        <Stat
          label="Classes"
          value={classes.length}
          hint="with notes on file"
        />
        <Stat
          label="Needs attention most"
          value={attention?.count ? attention.name : "—"}
          hint={
            attention?.count
              ? `${attention.count} unaddressed instances`
              : "all caught up"
          }
          accent="var(--amber)"
        />
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {["all", ...classes].map((c) => (
          <button
            key={c}
            className={`mc-filter ${filter === c ? "active" : ""}`}
            aria-pressed={filter === c}
            onClick={() =>
              router.replace(
                c === "all"
                  ? "/misconceptions"
                  : `/misconceptions?class=${encodeURIComponent(c)}`,
                { scroll: false },
              )
            }
          >
            {c === "all" ? "All classes" : c}
          </button>
        ))}
      </div>
      {!groups.length && (
        <EmptyState title="No misconceptions on file yet">
          They appear when a recorded lesson with a student reply that shows a
          wrong idea is analysed by Claude, or when you add notes while
          uploading an exit ticket.
        </EmptyState>
      )}
      {classes
        .filter((c) => filter === "all" || filter === c)
        .map((c) => (
          <section key={c} className="mb-6">
            {filter === "all" && <div className="eyebrow mb-3">{c}</div>}
            <div className="misconception-grid">
              {groups
                .filter((g) => g.yearGroup === c)
                .map((g) => (
                  <article
                    key={g.id}
                    className={`glass mc-card ${g.addressed ? "mc-addressed" : ""}`}
                  >
                    <span
                      className={`mc-count ${groupInstances(g) >= 7 ? "high" : groupInstances(g) >= 4 ? "medium" : "low"}`}
                    >
                      <b>{groupInstances(g) || "—"}</b>
                      <small>instances</small>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[13.5px] font-medium">{g.text}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="chip">
                          {g.lessons.length} lesson
                          {g.lessons.length === 1 ? "" : "s"}
                        </span>
                        {g.lessons.map((l) => (
                          <Link
                            key={l.id}
                            href={`/lessons/${l.id}#outcomes`}
                            className="chip max-w-full truncate"
                            title={l.title}
                          >
                            {l.title}
                          </Link>
                        ))}
                      </div>
                      {g.heardCount > 0 && (
                        <p className="text-[11px] text-dim mt-2">
                          {g.reportedCount} teacher-reported · {g.heardCount}{" "}
                          heard in lessons
                        </p>
                      )}
                      {g.unknownCounts > 0 && (
                        <p className="text-[11px] text-dim mt-2">
                          {g.unknownCounts} observation(s) without a count
                        </p>
                      )}
                    </div>
                    <button
                      className={`mc-details ${g.addressed ? "addressed" : ""}`}
                      onClick={(e) => {
                        origin.current = e.currentTarget;
                        setSelected(g.id);
                      }}
                    >
                      {g.addressed ? "Addressed" : "Details"}
                      <ChevronRight size={12} />
                    </button>
                  </article>
                ))}
            </div>
          </section>
        ))}
      <p className="text-xs text-dim">
        Counts are instances (teacher-reported counts plus replies heard in
        recordings), not unique students. Matching uses exact wording within
        each class.
      </p>
      <dialog
        ref={dialog}
        aria-labelledby="misconception-dialog-title"
        className="mc-dialog"
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
      >
        {group && (
          <div className="mc-dialog-body">
            <header className="flex items-start gap-4 mb-5">
              <div className="flex-1">
                <div className="eyebrow">
                  {group.yearGroup} ·{" "}
                  {groupInstances(group) || "Unknown number of"} instances
                  {group.heardCount > 0 &&
                    ` (${group.reportedCount} teacher-reported, ${group.heardCount} heard in lessons)`}
                </div>
                <h2
                  id="misconception-dialog-title"
                  className="text-xl font-semibold mt-2"
                >
                  {group.text}
                </h2>
              </div>
              <button
                className="btn btn-ghost !p-2"
                aria-label="Close details"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </header>
            <MisconceptionDetail group={group} />
          </div>
        )}
      </dialog>
    </>
  );
}
