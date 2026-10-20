import { MessageSquareQuote } from "lucide-react";
import { formatClock } from "@/lib/transcript";
import type { ReplyVerdict, StudentExchange, TranscriptSegment } from "@/lib/types";

const VERDICT: Record<ReplyVerdict, { label: string; color: string }> = {
  correct: { label: "correct", color: "var(--green)" },
  partial: { label: "partly right", color: "var(--amber)" },
  incorrect: { label: "incorrect", color: "var(--red)" },
  unclear: { label: "unclear", color: "var(--muted)" },
};

/**
 * Teacher questions paired with what students said back, with the analysis engine's verdict on
 * each reply. Everything shown is quoted from the transcript; students are never named.
 */
export function ExchangesSection({
  exchanges,
  note,
  segments,
}: {
  exchanges: StudentExchange[] | undefined;
  note: string | undefined;
  segments: TranscriptSegment[];
}) {
  const clock = (id: string) => {
    const seg = segments.find((s) => s.id === id);
    return seg ? formatClock(seg.start) : "";
  };
  const judged = (exchanges ?? []).filter((e) => e.verdict !== "unjudged");
  const count = (v: ReplyVerdict) => judged.filter((e) => e.verdict === v).length;

  return (
    <section className="mt-8 rise" style={{ animationDelay: "230ms" }}>
      <div className="flex items-end justify-between mb-1 gap-3 flex-wrap">
        <h2 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <MessageSquareQuote size={18} className="text-cyan" /> What students said
        </h2>
        {judged.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(Object.keys(VERDICT) as ReplyVerdict[]).map((v) => (
              <span key={v} className="chip" style={{ color: VERDICT[v].color, borderColor: "currentColor" }}>
                {VERDICT[v].label} · {count(v)}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-muted mb-4">
        Each question paired with the student speech that followed it. Speakers are separated into teacher and
        student only — individual students are not identified.
      </p>

      {exchanges === undefined ? (
        <div className="glass p-5 text-sm text-muted">
          This lesson was analysed before replies were paired with questions. Use “Re-analyse” to add this view.
        </div>
      ) : exchanges.length === 0 ? (
        <div className="glass p-5 text-sm text-muted">{note ?? "No question was directly followed by a student reply."}</div>
      ) : (
        <>
          {note && <p className="text-xs text-dim mb-3">{note}</p>}
          <div className="glass divide-y divide-line overflow-hidden">
            {exchanges.map((e) => {
              const v = e.verdict === "unjudged" ? null : VERDICT[e.verdict];
              const firstReply = e.responseSegmentIds[0];
              const chip = v ? (
                <span className="chip" style={{ color: v.color, borderColor: "currentColor" }}>
                  {v.label}
                </span>
              ) : (
                <span className="chip" title="Pattern engine cannot judge answers">
                  not judged
                </span>
              );
              return (
                <article key={e.id} className="px-4 py-3 grid grid-cols-[44px_1fr] sm:grid-cols-[52px_1fr_110px] gap-x-3 gap-y-1">
                  <span className="font-mono text-[11px] text-dim pt-0.5">{clock(firstReply)}</span>
                  <div className="min-w-0 text-sm">
                    <a href={`#seg-${e.questionSegmentId}`} className="text-muted hover:text-text block">
                      <span className="eyebrow !text-[10px] mr-2">Asked</span>
                      {e.question}
                      {e.nomination && <span className="chip ml-2 align-middle">named: {e.nomination.replace(/\?+$/, "")}</span>}
                    </a>
                    <a href={`#seg-${firstReply}`} className="block mt-1 italic text-text">
                      <span className="eyebrow !text-[10px] mr-2 not-italic">Reply</span>“{e.response}”
                    </a>
                    {/* Narrow screens have no verdict column, so the verdict sits with the reply instead. */}
                    <span className="sm:hidden mt-2 inline-flex">{chip}</span>
                    {e.rationale && <p className="mt-1 text-xs text-muted">{e.rationale}</p>}
                    {e.misconception && (
                      <p className="mt-2 text-xs rounded-lg px-3 py-2 bg-well border border-line">
                        <b>Possible misconception: </b>
                        {e.misconception.label}
                      </p>
                    )}
                  </div>
                  <span className="hidden sm:flex items-start justify-end">{chip}</span>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
