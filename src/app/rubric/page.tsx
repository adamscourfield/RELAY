import { ChevronDown } from "lucide-react";
import { RUBRIC, LEVEL_NAMES } from "@/lib/rubric";
import { PageHeader, levelColor } from "@/components/ui";

export const metadata = { title: "Rubric · RELAY" };

export default function RubricPage() {
  return (
    <>
      <PageHeader
        eyebrow="Transparency"
        title="The rubric behind every score"
      />
      <p className="text-muted max-w-2xl -mt-4 mb-8 rise">
        RELAY scores seven dimensions drawn from well-replicated research on
        effective instruction. Each is scored 1–4 with quoted evidence from the
        transcript. Weights reflect how reliably each can be judged from audio,
        not how much it matters.
      </p>
      <div className="rubric-list">
        {RUBRIC.map((d, i) => (
          <details
            key={d.id}
            className="rubric-disclosure rise"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <summary className="rubric-summary">
              <span className="rubric-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="rubric-summary-copy">
                <h2 className="text-[16px] font-semibold">{d.name}</h2>
                <p className="text-sm text-muted mt-1 max-w-2xl">
                  {d.evidence}
                </p>
              </div>
              <div className="rubric-summary-meta">
                <ChevronDown size={18} className="rubric-chevron" aria-hidden="true" />
              </div>
            </summary>
            <div className="rubric-levels grid min-[700px]:grid-cols-4 gap-3">
              {d.levels.map((l, li) => (
                <div
                  key={li}
                  className="rounded-lg p-3 border border-line bg-well"
                >
                  <div
                    className="text-xs font-medium"
                    style={{ color: levelColor(li + 1) }}
                  >
                    {li + 1} · {LEVEL_NAMES[li]}
                  </div>
                  <div className="text-[13px] text-muted mt-1.5 leading-relaxed">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
