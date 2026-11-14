import { BookOpen, Download, FileText, GitCompare, Layers, Lightbulb, Loader2, Network, Trash2, AlertTriangle } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import type { Job, ReportDetail, ReportKind, ReportMeta } from "@/api/types";
import { Badge, Button, Card, CardSkeleton, ConfirmModal, EmptyState, ErrorState, Modal, PageHeader, ProgressBar } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useResource } from "@/hooks/useResource";
import { chipifyTags } from "@/lib/answers";
import { errMsg, shortDate } from "@/lib/format";

const KINDS: { kind: ReportKind; title: string; text: string; icon: ComponentType<{ className?: string }> }[] = [
  { kind: "landscape", title: "Research Landscape", text: "Full overview: topics, trends, benchmarks, gaps.", icon: Layers },
  { kind: "methodology", title: "Methodology Analysis", text: "Method trends and like-for-like benchmark tables.", icon: GitCompare },
  { kind: "gaps", title: "Research Gap", text: "Topics and open questions worth pursuing.", icon: Lightbulb },
  { kind: "literature_review", title: "Literature Review", text: "Summary, topics and per-paper overview.", icon: BookOpen },
  { kind: "contradictions", title: "Contradiction Analysis", text: "Candidate conflicting findings for human review.", icon: AlertTriangle },
  { kind: "topic_relationships", title: "Topic Relationship", text: "How topics evolve and relate.", icon: Network },
];

export default function Reports() {
  const { api, corpus, mode, toast, bump } = useApp(); const [sp, setSp] = useSearchParams();
  const list = useResource((c) => api.reports.list(c));
  const [gen, setGen] = useState<ReportKind | null>(null); const [open, setOpen] = useState<ReportDetail | null>(null); const [loadingOpen, setLoadingOpen] = useState(false);
  const [del, setDel] = useState<ReportMeta | null>(null); const [filter, setFilter] = useState(""); const [busy, setBusy] = useState(false); const [picker, setPicker] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => { if (sp.get("new")) { setPicker(true); const n = new URLSearchParams(sp); n.delete("new"); setSp(n, { replace: true }); } }, [sp, setSp]);
  async function view(id: string) { setLoadingOpen(true); try { setOpen(await api.reports.get(id)); } catch (e) { toast("error", errMsg(e)); } finally { setLoadingOpen(false); } }
  useEffect(() => { const id = sp.get("id"); if (id) view(id); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function create(kind: ReportKind) {
    if (!corpus) return; setGen(kind); setPicker(false);
    try {
      const r = await api.reports.create(corpus.id, kind); setJob(r.job);
      for (let i = 0; i < 120; i++) {
        const j = await api.jobs.get(r.job.id); setJob(j);
        if (j.status === "done") { toast("success", "Report ready."); bump(); view(r.report_id); break; }
        if (j.status === "failed") throw new Error(j.error ?? "Report generation failed");
        await new Promise((res) => setTimeout(res, 1000));
      }
    } catch (e) { toast("error", errMsg(e)); } finally { setGen(null); setJob(null); }
  }
  async function remove() { if (!del) return; setBusy(true); try { await api.reports.remove(del.id); toast("success", "Report deleted."); if (open?.id === del.id) setOpen(null); setDel(null); bump(); } catch (e) { toast("error", errMsg(e)); } finally { setBusy(false); } }

  const rows = (list.data ?? []).filter((r) => !filter || r.kind === filter);
  const kindsGrid = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{KINDS.map((k) => (
      <button key={k.kind} disabled={!!gen || !corpus?.paper_count} onClick={() => create(k.kind)} className="card flex flex-col items-start gap-1 p-4 text-left transition hover:shadow-raised disabled:opacity-50">
        <k.icon className="h-5 w-5 text-forest" /><span className="text-sm font-bold">{k.title}</span><span className="text-xs text-ink-muted">{k.text}</span></button>))}</div>);

  return (
    <div className="space-y-5">
      <PageHeader title="Research Reports" subtitle="Generate, preview and download reports built from your collection." />
      <Card><h2 className="mb-3 text-sm font-bold">Generate a report</h2>{kindsGrid}
        {gen && <div className="mt-4"><p className="mb-1 flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" />Generating {KINDS.find((k) => k.kind === gen)?.title}…</p><ProgressBar value={job?.progress ?? 0} /></div>}
        <p className="mt-3 text-xs text-ink-muted">Reports are assembled from verified analysis results. Category reports show the relevant sections of the full analysis.</p></Card>
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold">Your reports</h2>
          <select aria-label="Filter by category" className="field !w-auto !py-1.5 text-xs" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All categories</option>{KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.title}</option>)}</select></div>
        {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading ? <CardSkeleton /> : !rows.length ? <EmptyState icon={<FileText className="h-6 w-6" />} title="No reports yet" text="Pick a category above to generate your first report." /> : (
          <ul className="space-y-2">{rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-sand-light p-3 shadow-inset">
              <FileText className="h-5 w-5 shrink-0 text-forest" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.title}</p><p className="text-xs text-ink-muted">{shortDate(r.created_at)} · {r.paper_count} papers {r.status !== "done" && <Badge tone={r.status === "failed" ? "bad" : "warn"}>{r.status}</Badge>}</p></div>
              <Button onClick={() => view(r.id)} disabled={r.status !== "done"}>Preview</Button>
              <Button aria-label={`Download ${r.title} PDF`} disabled={r.status !== "done" || (mode === "live" && !r.has_pdf)} onClick={() => api.reports.download(r.id, "pdf", r.title).catch((e) => toast("error", errMsg(e)))}><Download className="h-4 w-4" />PDF</Button>
              <Button variant="ghost" aria-label={`Delete ${r.title}`} className="!p-2" onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></Button></li>))}</ul>)}
      </Card>
      <Modal open={picker} onClose={() => setPicker(false)} title="Generate a report">{kindsGrid}</Modal>
      <Modal open={!!open || loadingOpen} onClose={() => setOpen(null)} title={open?.title ?? "Loading report…"}
        footer={open && <><Button onClick={() => api.reports.download(open.id, "md", open.title).catch((e) => toast("error", errMsg(e)))}>Markdown</Button>
          <Button variant="primary" disabled={!open.has_pdf && mode === "live"} onClick={() => api.reports.download(open.id, "pdf", open.title).catch((e) => toast("error", errMsg(e)))}><Download className="h-4 w-4" />Download PDF</Button></>}>
        {!open ? <CardSkeleton h="h-64" /> : <article className="prose-report"><ReactMarkdown remarkPlugins={[remarkGfm]}>{chipifyTags(open.markdown ?? "")}</ReactMarkdown></article>}
      </Modal>
      <ConfirmModal open={!!del} title="Delete this report?" text={`“${del?.title}” will be permanently deleted.`} busy={busy} onConfirm={remove} onClose={() => setDel(null)} />
    </div>
  );
}
