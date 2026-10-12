import Link from "next/link";
import { notFound } from "next/navigation";
import { RUBRIC, LEVEL_NAMES } from "@/lib/rubric";
import { listLessons } from "@/lib/store";
import { PageHeader, formatDate, levelColor } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DimensionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ level?: string }> }) {
  const { id } = await params;
  const dimension = RUBRIC.find((d) => d.id === id);
  if (!dimension) notFound();
  const lessons = (await listLessons()).filter((l) => l.analysis?.dimensions.some((d) => d.id === id));
  const requestedLevel = (await searchParams).level;
  const level = requestedLevel && ["1", "2", "3", "4"].includes(requestedLevel) ? Number(requestedLevel) : null;
  const filtered = level === null ? lessons : lessons.filter((lesson) => lesson.analysis!.dimensions.find((d) => d.id === id)!.score === level);
  const recent = lessons.slice(0, 5);
  const average = recent.length ? recent.reduce((total, l) => total + l.analysis!.dimensions.find((d) => d.id === id)!.score, 0) / recent.length : null;
  return <>
    <Link href="/" className="text-sm text-muted">← Overview</Link>
    <PageHeader eyebrow="Delivery breakdown" title={dimension.name} />
    <div className="dimension-summary">
      <div className="dimension-average">
        <span className="eyebrow">Recent average</span>
        <p><strong>{average === null ? "—" : average.toFixed(1)}</strong><span> / 4</span></p>
        <span className="text-xs text-muted">Last {recent.length} scored lessons</span>
      </div>
      <div className="dimension-explanation"><p>{dimension.evidence}</p><span className="text-xs text-muted">Explore the scoring guide and evidence from your lessons below.</span></div>
    </div>
    <h2 className="text-lg font-semibold mb-3">How this is scored</h2>
    <div className="grid min-[700px]:grid-cols-4 gap-3 mb-8">
      {dimension.levels.map((description, i) => <div key={i} className="glass p-4"><h3 className="text-sm font-semibold" style={{ color: levelColor(i + 1) }}>{i + 1} · {LEVEL_NAMES[i]}</h3><p className="text-sm text-muted mt-2">{description}</p></div>)}
    </div>
    <h2 className="text-lg font-semibold mb-3">Lesson breakdown</h2>
    <nav className="dimension-filters" aria-label="Filter by dimension score">
      {[null, 1, 2, 3, 4].map((value) => {
        const count = value === null ? lessons.length : lessons.filter((lesson) => lesson.analysis!.dimensions.find((d) => d.id === id)!.score === value).length;
        return <Link key={value ?? "all"} href={`/dimensions/${id}${value === null ? "" : `?level=${value}`}`} aria-current={level === value ? "page" : undefined}>{value === null ? "All levels" : LEVEL_NAMES[value - 1]} <span>{count}</span></Link>;
      })}
    </nav>
    <p className="text-xs text-muted mb-4">Showing {filtered.length} {filtered.length === 1 ? "lesson" : "lessons"}. Quotes are evidence for each lesson’s overall {dimension.short.toLowerCase()} rating.</p>
    <div className="grid gap-4">
      {filtered.map((lesson) => {
        const score = lesson.analysis!.dimensions.find((d) => d.id === id)!;
        return <article key={lesson.id} className="glass p-6">
          <div className="flex flex-wrap justify-between gap-3"><div><Link className="font-semibold" href={`/lessons/${lesson.id}`}>{lesson.title} →</Link><p className="text-xs text-muted mt-1">{lesson.subject} · {formatDate(lesson.date)}</p></div><span className="text-sm font-semibold" style={{ color: levelColor(score.score) }}>{LEVEL_NAMES[score.score - 1]} · {score.score}/4</span></div>
          <p className="text-sm mt-4">{score.rationale}</p>
          {score.evidence.map((e, i) => <blockquote key={i} className="mt-3 p-3 rounded-lg bg-well text-sm text-muted">“{e.quote}”</blockquote>)}
          {!score.evidence.length && <p className="mt-3 text-xs text-muted">No transcript quote was attached to this score.</p>}
        </article>;
      })}
      {!filtered.length && <p className="glass p-6 text-muted">{lessons.length ? "No lessons match this level yet. Choose another level to explore your evidence." : "Analyse a lesson to see its breakdown here."}</p>}
    </div>
  </>;
}
