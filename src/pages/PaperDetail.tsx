import { ArrowLeft, FileWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PaperDetail as PD } from "@/api/types";
import { Badge, Card, CardSkeleton, ErrorState, SectionTitle } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { errMsg, shortDate } from "@/lib/format";

export default function PaperDetail() {
  const { paperId = "" } = useParams(); const { api, mode } = useApp();
  const [p, setP] = useState<PD | null>(null); const [err, setErr] = useState<string | null>(null); const [pdf, setPdf] = useState<string | null>(null);
  useEffect(() => { setP(null); setErr(null); api.papers.get(paperId).then(setP).catch((e) => setErr(errMsg(e))); api.papers.pdfUrl(paperId).then(setPdf).catch(() => setPdf(null)); }, [api, paperId]);
  const back = <Link to="/library" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-purple-deep"><ArrowLeft className="h-4 w-4" />Back to library</Link>;
  if (err) return <div>{back}<ErrorState message={err} /></div>;
  if (!p) return <div>{back}<CardSkeleton h="h-64" /></div>;
  const x = p.extraction;
  return (
    <div className="space-y-5">
      {back}
      <Card>
        <h1 className="text-xl font-extrabold text-forest-deep sm:text-2xl">{p.title ?? p.filename}</h1>
        <p className="mt-1 text-sm text-ink-muted">{p.authors.join(", ") || "Unknown authors"} · {p.year ?? "year unknown"} · added {shortDate(p.created_at)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{p.topics.map((t) => <span key={t} className="chip">{t.split(",")[0]}</span>)}{p.methods.map((m) => <span key={m} className="chip-ai">{m}</span>)}
          {p.parse_quality != null && <Badge tone={p.parse_quality > 0.8 ? "ok" : "warn"}>parse quality {Math.round(p.parse_quality * 100)}%</Badge>}</div>
        {p.abstract && <><h2 className="mt-5 text-sm font-bold">Abstract</h2><p className="mt-1 text-sm leading-relaxed text-ink-muted">{p.abstract}</p></>}
        {p.error && <p className="mt-3 flex items-center gap-2 text-sm text-bad"><FileWarning className="h-4 w-4" />{p.error}</p>}
      </Card>
      {!x ? <Card><p className="text-sm text-ink-muted">No extraction yet — status: <b>{p.status}</b>.</p></Card> : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><SectionTitle title="Problem & methods" />
            <p className="text-sm">{x.problem || "Not stated."}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{x.methods.map((m) => <span key={m} className="chip-ai">{m}</span>)}{x.datasets.map((d) => <span key={d} className="chip">{d}</span>)}{x.metrics.map((m) => <span key={m} className="chip">{m}</span>)}</div></Card>
          <Card><SectionTitle title="Limitations & future work" />
            {x.limitations.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{x.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="text-sm text-ink-muted">None extracted.</p>}
            {x.future_work.length > 0 && <><h3 className="mt-4 text-xs font-bold uppercase text-ink-muted">Future work</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{x.future_work.map((l, i) => <li key={i}>{l}</li>)}</ul></>}</Card>
          <Card className="overflow-x-auto lg:col-span-2"><SectionTitle title="Reported results" hint="Each value links to the exact place in the paper it was read from" />
            {x.results.length ? (
              <table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="text-xs uppercase text-ink-muted"><th className="py-2">Dataset</th><th>Metric</th><th>Split</th><th>Method</th><th className="text-right">Value</th><th className="text-right">Source</th></tr></thead>
                <tbody>{x.results.map((r, i) => (<tr key={i} className="border-t border-sand-dark/60"><td className="py-2">{r.dataset}</td><td>{r.metric}</td><td>{r.split ?? "—"}</td><td>{r.method ?? "—"}</td>
                  <td className="text-right font-semibold">{r.value}{r.unit ?? ""}</td><td className="text-right text-xs text-ink-muted">{r.source.section}, p.{r.source.page}</td></tr>))}</tbody></table>
            ) : <p className="text-sm text-ink-muted">No numeric results were extracted.</p>}
            {x.unverified.length > 0 && <p className="mt-3 text-xs text-warn">{x.unverified.length} extracted item(s) could not be matched to the text and were discarded.</p>}</Card>
          {p.claims.length > 0 && <Card className="lg:col-span-2"><SectionTitle title="Claims" />
            <ul className="space-y-2 text-sm">{p.claims.map((c) => <li key={c.claim_id} className="rounded-xl bg-sand-light p-3 shadow-inset">{c.text}{c.source && <span className="ml-2 text-xs text-ink-muted">({c.source.section}, p.{c.source.page})</span>}</li>)}</ul></Card>}
        </div>
      )}
      <Card><SectionTitle title="Original PDF" />
        {pdf ? <iframe title="Paper PDF" src={pdf} className="h-[70vh] w-full rounded-xl shadow-inset" />
          : <p className="text-sm text-ink-muted">{mode === "demo" ? "Demo papers are invented, so there is no PDF to show." : "PDF is not available."}</p>}</Card>
    </div>
  );
}
