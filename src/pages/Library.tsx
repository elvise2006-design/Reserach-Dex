import { FileText, Grid2x2, List, Loader2, Search, Trash2, Upload, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Paper, PaperStatus } from "@/api/types";
import { Badge, Button, Card, ConfirmModal, EmptyState, ErrorState, PageHeader, Segmented, Skeleton } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useResource } from "@/hooks/useResource";
import { cx, errMsg, shortDate } from "@/lib/format";

type UiStatus = "Uploaded" | "Processing" | "Analysed" | "Failed";
const uiStatus = (s: PaperStatus): UiStatus => (s === "extracted" ? "Analysed" : s === "failed" ? "Failed" : s === "uploaded" ? "Uploaded" : "Processing");
const TONE = { Uploaded: "sand", Processing: "warn", Analysed: "ok", Failed: "bad" } as const;
type Sort = "recent" | "title" | "year";

export default function Library() {
  const { api, corpus, toast, bump } = useApp();
  const [sp, setSp] = useSearchParams();
  const papers = useResource((c) => api.papers.list(c));
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [topic, setTopic] = useState(""); const [year, setYear] = useState(""); const [author, setAuthor] = useState(""); const [method, setMethod] = useState("");
  const [status, setStatus] = useState(""); const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"table" | "list">("table");
  const [drag, setDrag] = useState(false); const [uploading, setUploading] = useState(false);
  const [del, setDel] = useState<Paper | null>(null); const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (sp.get("upload")) { input.current?.focus(); const n = new URLSearchParams(sp); n.delete("upload"); setSp(n, { replace: true }); } }, [sp, setSp]);
  // poll while anything is still processing
  const active = (papers.data ?? []).some((p) => ["uploaded", "parsing", "parsed"].includes(p.status));
  useEffect(() => { if (!active) return; const t = setInterval(papers.reload, 3000); return () => clearInterval(t); }, [active, papers.reload]);

  const all = papers.data ?? [];
  const opts = useMemo(() => ({
    topics: [...new Set(all.flatMap((p) => p.topics))].sort(), years: [...new Set(all.map((p) => p.year).filter(Boolean) as number[])].sort((a, b) => b - a),
    authors: [...new Set(all.flatMap((p) => p.authors))].sort(), methods: [...new Set(all.flatMap((p) => p.methods))].sort(),
  }), [all]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = all.filter((p) => (!t || `${p.title ?? ""} ${p.filename} ${p.authors.join(" ")} ${p.abstract}`.toLowerCase().includes(t))
      && (!topic || p.topics.includes(topic)) && (!year || String(p.year) === year) && (!author || p.authors.includes(author))
      && (!method || p.methods.includes(method)) && (!status || uiStatus(p.status) === status));
    return r.sort((a, b) => sort === "title" ? (a.title ?? a.filename).localeCompare(b.title ?? b.filename)
      : sort === "year" ? (b.year ?? 0) - (a.year ?? 0) : +new Date(b.created_at ?? 0) - +new Date(a.created_at ?? 0));
  }, [all, q, topic, year, author, method, status, sort]);

  async function upload(files: FileList | File[]) {
    const pdfs = [...files].filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length < [...files].length) toast("error", "Only PDF files are accepted — others were skipped.");
    if (!pdfs.length || !corpus) return;
    setUploading(true);
    try {
      const r = await api.papers.upload(corpus.id, pdfs);
      toast("success", `${r.accepted.length} paper${r.accepted.length === 1 ? "" : "s"} uploaded${r.duplicates.length ? `, ${r.duplicates.length} duplicate skipped` : ""}.`);
      bump();
    } catch (e) { toast("error", errMsg(e)); } finally { setUploading(false); }
  }
  async function remove() {
    if (!del) return; setBusy(true);
    try { await api.papers.remove(del.id); toast("success", "Paper removed."); setDel(null); bump(); } catch (e) { toast("error", errMsg(e)); } finally { setBusy(false); }
  }

  const sel = (v: string, set: (s: string) => void, label: string, list: (string | number)[]) => (
    <select aria-label={label} value={v} onChange={(e) => set(e.target.value)} className="field !w-auto !py-2 text-xs">
      <option value="">{label}</option>{list.map((o) => <option key={o} value={String(o)}>{o}</option>)}
    </select>);

  return (
    <div className="space-y-5">
      <PageHeader title="Research Library" subtitle="Upload, organise and explore your papers."
        right={<Button variant="primary" onClick={() => input.current?.click()}><Upload className="h-4 w-4" />Upload papers</Button>} />
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        className={cx("rounded-2xl border-2 border-dashed p-6 text-center transition", drag ? "border-purple bg-purple-soft/50" : "border-sand-dark bg-sand-light/60")}>
        <UploadCloud className="mx-auto h-8 w-8 text-forest" aria-hidden />
        <p className="mt-2 text-sm font-semibold">Drag & drop PDFs here</p>
        <p className="text-xs text-ink-muted">or <button className="font-semibold text-purple-deep underline" onClick={() => input.current?.click()}>browse files</button> · multiple files supported</p>
        <input ref={input} type="file" accept="application/pdf,.pdf" multiple hidden aria-label="Upload PDF files" onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} />
        {uploading && <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" />Uploading…</p>}
      </div>

      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input className="field !pl-9" placeholder="Search title, author, abstract…" aria-label="Search papers" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {sel(topic, setTopic, "Topic", opts.topics)}{sel(year, setYear, "Year", opts.years)}{sel(author, setAuthor, "Author", opts.authors)}{sel(method, setMethod, "Methodology", opts.methods)}
          {sel(status, setStatus, "Status", ["Uploaded", "Processing", "Analysed", "Failed"])}
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !w-auto !py-2 text-xs">
            <option value="recent">Newest first</option><option value="title">Title A–Z</option><option value="year">Year</option></select>
          <Segmented<"table" | "list"> label="View" value={view} onChange={setView} options={[{ value: "table", aria: "Table view", label: <Grid2x2 className="h-4 w-4" /> }, { value: "list", aria: "List view", label: <List className="h-4 w-4" /> }]} />
        </div>
      </Card>

      {papers.error ? <ErrorState message={papers.error} onRetry={papers.reload} /> : papers.loading && !all.length ? (
        <Card className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</Card>
      ) : !all.length ? (
        <Card><EmptyState icon={<FileText className="h-6 w-6" />} title="Your library is empty" text="Upload research papers (PDF) to start building your knowledge base." action={<Button variant="primary" onClick={() => input.current?.click()}>Upload papers</Button>} /></Card>
      ) : !rows.length ? (
        <Card><EmptyState icon={<Search className="h-6 w-6" />} title="No papers match" text="Try clearing a filter or searching for something else." action={<Button onClick={() => { setQ(""); setTopic(""); setYear(""); setAuthor(""); setMethod(""); setStatus(""); }}>Clear filters</Button>} /></Card>
      ) : view === "table" ? (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="text-xs uppercase tracking-wide text-ink-muted"><th className="p-4">Title</th><th>Authors</th><th>Year</th><th>Topics</th><th>Status</th><th className="pr-4 text-right">Actions</th></tr></thead>
            <tbody>{rows.map((p) => (
              <tr key={p.id} className="border-t border-sand-dark/60 align-top hover:bg-sand-light/60">
                <td className="max-w-xs p-4"><Link to={`/library/${p.id}`} className="font-semibold text-forest-deep hover:text-purple-deep">{p.title ?? p.filename}</Link><p className="text-xs text-ink-muted">{shortDate(p.created_at)}</p></td>
                <td className="max-w-40 py-4 text-ink-muted">{p.authors.slice(0, 2).join(", ") || "—"}{p.authors.length > 2 && ` +${p.authors.length - 2}`}</td>
                <td className="py-4">{p.year ?? "—"}</td>
                <td className="py-4"><div className="flex flex-wrap gap-1">{p.topics.slice(0, 2).map((t) => <span key={t} className="chip">{t.split(",")[0]}</span>)}</div></td>
                <td className="py-4"><Badge tone={TONE[uiStatus(p.status)]}>{uiStatus(p.status) === "Processing" && <Loader2 className="h-3 w-3 animate-spin" />}{uiStatus(p.status)}</Badge></td>
                <td className="py-4 pr-4 text-right"><Button variant="ghost" className="!p-2" aria-label={`Remove ${p.title ?? p.filename}`} onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>))}</tbody>
          </table>
        </Card>
      ) : (
        <ul className="space-y-3">{rows.map((p) => (
          <li key={p.id}><Card className="flex items-start gap-4 !p-4">
            <FileText className="mt-1 h-5 w-5 shrink-0 text-forest" />
            <div className="min-w-0 flex-1">
              <Link to={`/library/${p.id}`} className="font-semibold text-forest-deep hover:text-purple-deep">{p.title ?? p.filename}</Link>
              <p className="text-xs text-ink-muted">{p.authors.join(", ") || "Unknown authors"} · {p.year ?? "year unknown"}</p>
              {p.abstract && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.abstract}</p>}
              <div className="mt-2 flex flex-wrap gap-1">{p.topics.map((t) => <span key={t} className="chip">{t.split(",")[0]}</span>)}{p.methods.slice(0, 3).map((m) => <span key={m} className="chip-ai">{m}</span>)}</div>
            </div>
            <Badge tone={TONE[uiStatus(p.status)]}>{uiStatus(p.status)}</Badge>
            <Button variant="ghost" className="!p-2" aria-label={`Remove ${p.title ?? p.filename}`} onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /></Button>
          </Card></li>))}</ul>
      )}
      <p className="text-xs text-ink-muted" aria-live="polite">{rows.length} of {all.length} papers shown</p>
      <ConfirmModal open={!!del} title="Remove this paper?" text={`“${del?.title ?? del?.filename}” and its extracted data will be deleted. Collection analytics update afterwards.`} confirmLabel="Remove" busy={busy} onConfirm={remove} onClose={() => setDel(null)} />
    </div>
  );
}
