import { Bot, Download, FileText, FlaskConical, GitCompare, Layers, Lightbulb, Loader2, Microscope, Search as SearchIcon, Sparkles, TrendingUp, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Answer } from "@/api/types";
import { AnswerView } from "@/components/AnswerView";
import { Bars, Donut } from "@/components/charts";
import { MiniGraph } from "@/components/MiniGraph";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, SectionTitle } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useResource } from "@/hooks/useResource";
import { errMsg, relTime, shortDate } from "@/lib/format";
import { computeInsights, methodDistribution, papersByYear, topicDistribution } from "@/lib/insights";

function Stat({ icon: I, label, value, tone }: { icon: typeof Layers; label: string; value: number | string; tone?: "ai" }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-inset ${tone === "ai" ? "bg-purple-soft text-purple-deep" : "bg-forest-soft text-forest"}`}><I className="h-5 w-5" /></div>
      <div><p className="font-heading text-3xl font-extrabold text-forest-deep">{value}</p><p className="text-xs font-medium text-ink-muted">{label}</p></div>
    </Card>
  );
}

function CompactAssistant() {
  const { api, corpus, toast } = useApp(); const nav = useNavigate();
  const [q, setQ] = useState(""); const [busy, setBusy] = useState(false); const [ans, setAns] = useState<{ q: string; a: Answer } | null>(null);
  async function ask(text: string) {
    if (!corpus || !text.trim()) return; setBusy(true); setQ("");
    try { setAns({ q: text, a: await api.qa.ask(corpus.id, text) }); } catch (e) { toast("error", errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <Card>
      <SectionTitle icon={<Sparkles className="h-4 w-4 text-purple-deep" />} title="Research assistant" hint="Ask across your whole collection. Answers cite their sources." />
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
        <input className="field" placeholder="e.g. What research gaps remain unexplored?" aria-label="Ask a question" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="ai" type="submit" disabled={busy || !q.trim()} aria-label="Ask">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}</Button>
      </form>
      {!ans && !busy && <div className="mt-3 flex flex-wrap gap-2">{api.qa.suggested(corpus?.id ?? "").slice(0, 3).map((s) => <button key={s} onClick={() => ask(s)} className="chip-ai hover:bg-purple/30">{s}</button>)}</div>}
      {busy && <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" />Searching papers and verifying citations…</p>}
      {ans && !busy && (
        <div className="mt-4 rounded-xl bg-sand-light p-4 shadow-inset">
          <p className="mb-2 text-xs font-semibold text-ink-muted">You asked: {ans.q}</p><AnswerView answer={ans.a} />
          <Button variant="secondary" className="mt-3 !py-1.5" onClick={() => nav("/ai", { state: { question: ans.q } })}>Continue in AI Researcher</Button>
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { api, corpus, mode, toast } = useApp(); const nav = useNavigate();
  const papers = useResource((c) => api.papers.list(c)); const topics = useResource((c) => api.analytics.topics(c));
  const trends = useResource((c) => api.analytics.trends(c)); const gaps = useResource((c) => api.analytics.gaps(c));
  const contr = useResource((c) => api.analytics.contradictions(c)); const reports = useResource((c) => api.reports.list(c));
  const loading = papers.loading || topics.loading || trends.loading;
  const error = papers.error ?? topics.error ?? trends.error;
  const analysed = (papers.data ?? []).filter((p) => p.status === "extracted");
  const ins = useMemo(() => computeInsights(topics.data ?? [], trends.data ?? [], gaps.data ?? [], contr.data ?? []), [topics.data, trends.data, gaps.data, contr.data]);
  const methodCount = (trends.data ?? []).filter((t) => t.kind === "method").length;
  const timeline = useMemo(() => [
    ...(papers.data ?? []).map((p) => ({ t: p.created_at, text: `Added “${p.title ?? p.filename}”`, kind: "paper" })),
    ...(reports.data ?? []).map((r) => ({ t: r.created_at, text: `Generated ${r.title}`, kind: "report" })),
  ].filter((e) => e.t).sort((a, b) => +new Date(b.t!) - +new Date(a.t!)).slice(0, 6), [papers.data, reports.data]);

  if (error) return <ErrorState message={error} onRetry={() => { papers.reload(); topics.reload(); trends.reload(); }} />;
  if (!loading && !papers.data?.length) return (
    <div className="mx-auto max-w-xl pt-10">
      <Card><EmptyState icon={<Upload className="h-6 w-6" />} title="Welcome, Researcher" text="Upload your first academic papers and ResearchDex will map topics, methods, gaps and contradictions across them."
        action={<Button variant="primary" onClick={() => nav("/library?upload=1")}><Upload className="h-4 w-4" />Upload papers</Button>} /></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-deep sm:text-3xl">Welcome back, Researcher.</h1>
        <p className="mt-1 text-sm text-ink-muted">Let’s explore your research landscape{corpus ? <> in <b className="text-forest">{corpus.name}</b></> : ""}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} h="h-12" />) : <>
          <Stat icon={Layers} label="Papers analysed" value={analysed.length} />
          <Stat icon={Microscope} label="Research topics" value={topics.data?.length ?? 0} />
          <Stat icon={GitCompare} label="Methodologies identified" value={methodCount} />
          <Stat icon={Lightbulb} label="Research gaps found" value={gaps.data?.length ?? 0} tone="ai" />
        </>}
      </div>

      <section aria-label="Research overview" className="grid gap-4 lg:grid-cols-2">
        <Card><SectionTitle title="Topic distribution" hint="Papers per discovered topic" />{loading ? <CardSkeleton /> : <Donut data={topicDistribution(topics.data ?? [])} label="Topic distribution" />}</Card>
        <Card><SectionTitle title="Publication trends" hint="Papers by publication year" />{loading ? <CardSkeleton /> : <Bars data={papersByYear(papers.data ?? [])} x="year" label="Publication trends" />}</Card>
        <Card><SectionTitle title="Methodology distribution" hint="Papers using each method" />{loading ? <CardSkeleton /> : <Bars data={methodDistribution(trends.data ?? [])} horizontal label="Methodology distribution" height={250} />}</Card>
        <Card>
          <SectionTitle title="Research activity" hint="Most recent events" />
          {!timeline.length ? <p className="text-sm text-ink-muted">No activity yet.</p> : (
            <ol className="relative space-y-4 border-l-2 border-sand-dark pl-5">{timeline.map((e, i) => (
              <li key={i} className="relative"><span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-sand-card ${e.kind === "report" ? "bg-purple" : "bg-forest"}`} />
                <p className="text-sm font-medium">{e.text}</p><p className="text-xs text-ink-muted">{relTime(e.t)} · {shortDate(e.t)}</p></li>))}</ol>)}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionTitle icon={<Sparkles className="h-4 w-4 text-purple-deep" />} title="Key insights" hint="Computed from your papers — not written by a language model" />
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><Microscope className="mt-0.5 h-4 w-4 shrink-0 text-forest" /><span><b>Most discussed topic:</b> {ins.topTopic ? `${ins.topTopic.label} (${ins.topTopic.papers} papers)` : "not enough data"}</span></li>
            <li className="flex gap-3"><GitCompare className="mt-0.5 h-4 w-4 shrink-0 text-forest" /><span><b>Most frequent methodology:</b> {ins.topMethod ? `${ins.topMethod.name} (${ins.topMethod.papers} papers)` : "not enough data"}</span></li>
            <li className="flex gap-3"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-forest" /><span><b>Emerging:</b> {ins.emerging.length ? ins.emerging.slice(0, 3).map((e) => e.key).join(" · ") : "nothing meets the emerging threshold yet (≥3 recent papers)"}</span></li>
            <li className="flex gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" /><span><b>Gaps:</b> {ins.gaps.length ? <>{ins.gaps[0].description}{ins.gaps.length > 1 && <> <Link to="/discover" className="font-semibold text-purple-deep">+{ins.gaps.length - 1} more</Link></>}</> : "none detected"}</span></li>
            <li className="flex gap-3"><GitCompare className="mt-0.5 h-4 w-4 shrink-0 text-bad" /><span><b>Contradictory findings:</b> {ins.contradictions ? <>{ins.contradictions} candidate pair{ins.contradictions > 1 ? "s" : ""} <Badge tone="warn">needs human review</Badge></> : "none detected"}</span></li>
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <SectionTitle title="Research knowledge graph" hint="Topics and their leading methods" right={<Link to="/graph" className="text-xs font-semibold text-purple-deep">Open graph →</Link>} />
          {loading ? <CardSkeleton /> : (topics.data?.length ? <MiniGraph topics={topics.data} papers={papers.data ?? []} name={corpus?.name ?? ""} /> : <p className="text-sm text-ink-muted">Topics appear once analysis finishes.</p>)}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CompactAssistant />
        <Card>
          <SectionTitle icon={<FileText className="h-4 w-4 text-forest" />} title="Recent research reports" right={<Link to="/reports" className="text-xs font-semibold text-purple-deep">All reports →</Link>} />
          {!reports.data?.length ? <EmptyState icon={<FileText className="h-5 w-5" />} title="No reports yet" text="Generate a landscape or gap report from the Reports page." action={<Button onClick={() => nav("/reports?new=1")}>Generate a report</Button>} /> : (
            <ul className="space-y-2">{reports.data.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-sand-light p-3 shadow-inset">
                <FileText className="h-5 w-5 shrink-0 text-forest" />
                <div className="min-w-0 flex-1"><Link to={`/reports?id=${r.id}`} className="block truncate text-sm font-semibold hover:text-forest">{r.title}</Link><p className="text-xs text-ink-muted">{shortDate(r.created_at)} · {r.paper_count} papers</p></div>
                <Button variant="ghost" aria-label={`Export ${r.title} as PDF`} className="!p-2" disabled={!r.has_pdf && mode === "live"}
                  onClick={() => api.reports.download(r.id, r.has_pdf ? "pdf" : "md", r.title).catch((e) => toast("error", errMsg(e)))}><Download className="h-4 w-4" /><span className="hidden sm:inline">{r.has_pdf ? "PDF" : "MD"}</span></Button>
              </li>))}</ul>)}
        </Card>
      </section>
      {mode === "demo" && <p className="flex items-center gap-2 text-xs text-ink-muted"><FlaskConical className="h-3.5 w-3.5" />Everything above is sample data from invented papers.</p>}
      <p className="sr-only"><SearchIcon />Dashboard</p>
    </div>
  );
}
