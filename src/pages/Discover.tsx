import { AlertTriangle, GitCompare, Lightbulb, Network, TrendingUp, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bars, Evolution, NoData } from "@/components/charts";
import { Badge, Card, CardSkeleton, ErrorState, PageHeader, SectionTitle } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useResource } from "@/hooks/useResource";
import { pct } from "@/lib/format";
import { methodDistribution, topicDistribution, topicEvolution, topicRelationships } from "@/lib/insights";

const GAP_LABEL = { untested_pair: "Untested combination", recurring_limitation: "Recurring limitation", understudied_topic: "Understudied topic" } as const;

export default function Discover() {
  const { api } = useApp();
  const topics = useResource((c) => api.analytics.topics(c)); const trends = useResource((c) => api.analytics.trends(c));
  const papers = useResource((c) => api.papers.list(c)); const gaps = useResource((c) => api.analytics.gaps(c));
  const contr = useResource((c) => api.analytics.contradictions(c)); const cmp = useResource((c) => api.analytics.compare(c));
  const [sel, setSel] = useState<string[]>([]); const [gapKind, setGapKind] = useState("");
  const err = topics.error ?? trends.error ?? gaps.error;
  const topicKeys = useMemo(() => (trends.data ?? []).filter((t) => t.kind === "topic").map((t) => t.key), [trends.data]);
  const shown = sel.length ? sel : topicKeys.slice(0, 5);
  const evo = useMemo(() => topicEvolution(trends.data ?? [], shown), [trends.data, shown]);
  const rel = useMemo(() => topicRelationships(topics.data ?? [], papers.data ?? []), [topics.data, papers.data]);
  const gapRows = (gaps.data ?? []).filter((g) => !gapKind || g.kind === gapKind);
  if (err) return <ErrorState message={err} onRetry={() => { topics.reload(); trends.reload(); gaps.reload(); }} />;
  const load = topics.loading || trends.loading;

  return (
    <div className="space-y-6">
      <PageHeader title="Discover" subtitle="Six analytical views of your collection. Everything is computed from the papers you uploaded." />

      <Card><SectionTitle icon={<Layers className="h-4 w-4 text-forest" />} title="1 · Research landscape" hint="Topics found in the collection and their size" />
        {load ? <CardSkeleton /> : <div className="grid gap-4 lg:grid-cols-2">
          <Bars data={topicDistribution(topics.data ?? [])} horizontal height={260} label="Papers per topic" />
          <ul className="space-y-2">{(topics.data ?? []).map((t) => (
            <li key={t.topic_id} className="rounded-xl bg-sand-light p-3 shadow-inset"><p className="text-sm font-semibold">{t.label} <span className="text-ink-muted">· {t.paper_ids.length} paper{t.paper_ids.length === 1 ? "" : "s"}</span></p>
              <p className="text-xs text-ink-muted">{t.terms.slice(0, 6).join(", ")}</p></li>))}</ul></div>}</Card>

      <Card><SectionTitle icon={<TrendingUp className="h-4 w-4 text-forest" />} title="2 · Trends & topic evolution" hint="Papers per year; pick topics to compare" />
        {load ? <CardSkeleton /> : <>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Topics to plot">{topicKeys.map((k) => {
            const on = shown.includes(k);
            return <button key={k} aria-pressed={on} onClick={() => setSel(on ? shown.filter((x) => x !== k) : [...shown, k])}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-forest text-onaccent shadow-raised-sm" : "bg-sand-light text-ink-muted shadow-inset"}`}>{k.split(",")[0]}</button>;
          })}</div>
          {evo.length ? <Evolution data={evo} keys={shown} /> : <NoData text="Select at least one topic with dated papers" />}
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead><tr className="text-xs uppercase text-ink-muted"><th className="py-2">Topic / method</th><th>Papers</th><th>CAGR</th><th>Status</th></tr></thead>
            <tbody>{(trends.data ?? []).slice().sort((a, b) => b.total - a.total).slice(0, 10).map((t) => (
              <tr key={t.kind + t.key} className="border-t border-sand-dark/60"><td className="py-2">{t.key.split(",")[0]} <span className="text-xs text-ink-faint">{t.kind}</span></td><td>{t.total}</td><td>{pct(t.cagr)}</td><td>{t.emerging ? <Badge tone="ai">Emerging</Badge> : "—"}</td></tr>))}</tbody></table></div>
        </>}</Card>

      <Card><SectionTitle icon={<GitCompare className="h-4 w-4 text-forest" />} title="3 · Methodology analysis" hint="Method frequency and like-for-like benchmark tables" />
        {load ? <CardSkeleton /> : <Bars data={methodDistribution(trends.data ?? [], 10)} horizontal height={260} label="Methods by paper count" />}
        <h3 className="mb-2 mt-5 text-sm font-bold">Comparable results</h3>
        {cmp.loading ? <CardSkeleton /> : !cmp.data?.length ? <p className="text-sm text-ink-muted">No two papers report the same dataset, metric and split, so nothing is comparable yet. Numbers are never compared across different setups.</p> : cmp.data.map((g, i) => (
          <div key={i} className="mb-4 overflow-x-auto rounded-xl bg-sand-light p-3 shadow-inset"><p className="mb-1 text-sm font-semibold">{g.dataset} · {g.metric}{g.split ? ` · ${g.split}` : ""} <span className="text-xs font-normal text-ink-muted">({g.lower_is_better ? "lower" : "higher"} is better)</span></p>
            <table className="w-full text-sm"><tbody>{g.rows.map((r) => <tr key={r.tag} className="border-t border-sand-dark/50"><td className="py-1.5">{r.method ?? "unspecified method"}</td><td className="text-right font-semibold">{r.value}{r.unit ?? ""}</td><td className="pl-3 text-right text-xs text-ink-muted"><code>{r.tag}</code></td></tr>)}</tbody></table></div>))}</Card>

      <Card><SectionTitle icon={<Lightbulb className="h-4 w-4 text-warn" />} title="4 · Research gaps" hint="Candidates for further research — leads, not conclusions"
        right={<select aria-label="Gap type" value={gapKind} onChange={(e) => setGapKind(e.target.value)} className="field !w-auto !py-1.5 text-xs"><option value="">All types</option>{Object.entries(GAP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>} />
        {gaps.loading ? <CardSkeleton /> : !gapRows.length ? <p className="text-sm text-ink-muted">No gaps detected.</p> : <ul className="space-y-2">{gapRows.map((g, i) => (
          <li key={i} className="flex gap-3 rounded-xl bg-sand-light p-3 shadow-inset"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn" /><div><p className="text-sm">{g.description}</p>
            <p className="mt-1 text-xs text-ink-muted"><Badge tone="warn">{GAP_LABEL[g.kind]}</Badge> · {g.evidence_papers.length} supporting paper{g.evidence_papers.length === 1 ? "" : "s"} · score {g.score.toFixed(2)}</p></div></li>))}</ul>}</Card>

      <Card><SectionTitle icon={<AlertTriangle className="h-4 w-4 text-bad" />} title="5 · Contradictory findings" hint="Candidate pairs surfaced by a language model — every one needs human review" />
        {contr.loading ? <CardSkeleton /> : !contr.data?.length ? <p className="text-sm text-ink-muted">No candidate contradictions found.</p> : <ul className="space-y-3">{contr.data.map((c, i) => (
          <li key={i} className="rounded-xl bg-sand-light p-4 shadow-inset"><div className="mb-2 flex items-center gap-2"><Badge tone="warn">Candidate</Badge><span className="text-xs text-ink-muted">confidence {Math.round(c.confidence * 100)}%</span></div>
            <div className="grid gap-3 sm:grid-cols-2">{c.evidence.map((e) => (<blockquote key={e.claim_id} className="rounded-lg bg-sand-card p-3 text-sm shadow-raised-sm">“{e.text}”<footer className="mt-1 text-xs text-ink-muted">{e.paper_title}{e.source ? ` · ${e.source.section}, p.${e.source.page}` : ""}</footer></blockquote>))}</div>
            <p className="mt-2 text-xs text-ink-muted">{c.rationale}</p></li>))}</ul>}</Card>

      <Card><SectionTitle icon={<Network className="h-4 w-4 text-forest" />} title="6 · Topic relationships" hint="Topics linked by methods used in both" />
        {load ? <CardSkeleton /> : !rel.length ? <p className="text-sm text-ink-muted">No shared methods between topics yet.</p> : <ul className="space-y-2">{rel.slice(0, 8).map((r, i) => (
          <li key={i} className="rounded-xl bg-sand-light p-3 text-sm shadow-inset"><b>{r.a.split(",")[0]}</b> ↔ <b>{r.b.split(",")[0]}</b><span className="text-ink-muted"> — {r.shared.length} shared method{r.shared.length > 1 ? "s" : ""}: {r.shared.slice(0, 4).join(", ")}</span></li>))}</ul>}
        <p className="mt-3 text-xs text-ink-muted">See these connections visually in the <Link to="/graph" className="font-semibold text-purple-deep">Knowledge Graph</Link>.</p></Card>
    </div>
  );
}
