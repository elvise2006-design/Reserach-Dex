import { Bot, History, Loader2, Quote, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { Answer } from "@/api/types";
import { AnswerView } from "@/components/AnswerView";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { relatedQuestions } from "@/lib/answers";
import { errMsg } from "@/lib/format";

interface Turn { id: string; q: string; a?: Answer; error?: string; at: number }
const key = (c: string) => `rdx_chat_${c}`;
const load = (c: string): Turn[] => { try { return JSON.parse(localStorage.getItem(key(c)) ?? "[]"); } catch { return []; } };

export default function Researcher() {
  const { api, corpus, corpora, setCorpusId, prefs, toast } = useApp();
  const [sp, setSp] = useSearchParams(); const loc = useLocation();
  const [turns, setTurns] = useState<Turn[]>([]); const [q, setQ] = useState(""); const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<{ turn: string; n: number } | null>(null); const end = useRef<HTMLDivElement>(null);
  const cid = corpus?.id ?? "";
  useEffect(() => { setTurns(cid ? load(cid) : []); setActive(null); }, [cid]);
  useEffect(() => { if (cid) localStorage.setItem(key(cid), JSON.stringify(turns.slice(-30))); end.current?.scrollIntoView?.({ behavior: "smooth" }); }, [turns, cid]);

  async function ask(text: string) {
    const t = text.trim(); if (!t || !cid || busy) return;
    const id = String(Date.now()); setQ(""); setBusy(true); setTurns((x) => [...x, { id, q: t, at: Date.now() }]);
    try { const a = await api.qa.ask(cid, t); setTurns((x) => x.map((y) => (y.id === id ? { ...y, a } : y))); setActive({ turn: id, n: 1 }); }
    catch (e) { setTurns((x) => x.map((y) => (y.id === id ? { ...y, error: errMsg(e) } : y))); toast("error", errMsg(e)); }
    finally { setBusy(false); }
  }
  const handled = useRef(false);
  useEffect(() => {
    const pre = sp.get("q") ?? (loc.state as { question?: string } | null)?.question;
    if (pre && cid && !handled.current) { handled.current = true; ask(pre); if (sp.get("q")) setSp({}, { replace: true }); }
  }, [cid]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = turns.length ? turns[turns.length - 1] : undefined;
  const sourceTurn = turns.find((t) => t.id === (active?.turn ?? last?.id)); const cites = sourceTurn?.a?.citations ?? [];
  const suggestions = api.qa.suggested(cid);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-forest-deep sm:text-3xl">AI Researcher</h1><p className="mt-1 text-sm text-ink-muted">Ask questions about your papers. Every statement is checked against the source text.</p></div>
        <label className="text-xs font-semibold text-ink-muted">Collection
          <select className="field mt-1 !py-2" value={cid} onChange={(e) => setCorpusId(e.target.value)} aria-label="Collection">{corpora.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.paper_count})</option>)}</select></label>
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_320px]">
        <Card className="hidden lg:block"><h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><History className="h-4 w-4" />History</h2>
          {!turns.length ? <p className="text-xs text-ink-muted">No questions yet.</p> : <ul className="space-y-1">{[...turns].reverse().map((t) => (
            <li key={t.id}><button onClick={() => { setActive({ turn: t.id, n: 1 }); document.getElementById(`turn-${t.id}`)?.scrollIntoView?.({ behavior: "smooth" }); }} className="w-full truncate rounded-lg px-2 py-1.5 text-left text-xs hover:bg-sand-dark/40" title={t.q}>{t.q}</button></li>))}</ul>}
          {turns.length > 0 && <Button variant="ghost" className="mt-3 w-full !py-1.5 text-xs" onClick={() => { setTurns([]); setActive(null); }}><Trash2 className="h-3.5 w-3.5" />Clear history</Button>}
          <p className="mt-3 text-[11px] text-ink-faint">History is stored in this browser only.</p></Card>

        <Card className="flex min-h-[60vh] flex-col !p-0">
          <div className="flex-1 space-y-5 overflow-auto p-5" aria-live="polite">
            {!turns.length && <EmptyState icon={<Bot className="h-6 w-6" />} title="Ask your first question" text={corpus && corpus.paper_count ? "Try one of the suggestions below." : "Upload and analyse papers first, then ask questions here."} />}
            {turns.map((t) => (
              <div key={t.id} id={`turn-${t.id}`} className="space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-forest px-4 py-2.5 text-sm text-onaccent shadow-raised-sm">{t.q}</div>
                <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-sand-light p-4 shadow-inset">
                  {t.error ? <p className="text-sm text-bad">{t.error}</p> : !t.a ? <p className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" />Searching papers and verifying citations…</p> :
                    <><AnswerView answer={t.a} activeCite={active?.turn === t.id ? active.n : null} onCite={(n) => setActive({ turn: t.id, n })} />
                      {prefs.showSuggestions && t.id === last?.id && relatedQuestions(t.a.citations).length > 0 && <div className="mt-4"><p className="mb-1.5 text-xs font-semibold text-ink-muted">Related questions</p><div className="flex flex-wrap gap-2">{relatedQuestions(t.a.citations).map((r) => <button key={r} className="chip-ai hover:bg-purple/30 text-left" onClick={() => ask(r)}>{r}</button>)}</div></div>}</>}
                </div>
              </div>))}
            <div ref={end} />
          </div>
          <div className="border-t border-sand-dark/60 p-4">
            {prefs.showSuggestions && !turns.length && <div className="mb-3 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} onClick={() => ask(s)} className="chip-ai hover:bg-purple/30 text-left">{s}</button>)}</div>}
            <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
              <input className="field" placeholder="Ask about methods, results, gaps, contradictions…" aria-label="Your question" value={q} onChange={(e) => setQ(e.target.value)} disabled={!corpus} />
              <Button variant="ai" type="submit" disabled={busy || !q.trim() || !corpus} aria-label="Send">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></form>
          </div>
        </Card>

        <Card><h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Quote className="h-4 w-4 text-purple-deep" />Sources</h2>
          {!cites.length ? <p className="text-xs text-ink-muted">Citations for the selected answer appear here. Click a numbered chip to jump to its source.</p> : (
            <ol className="space-y-3">{cites.map((c, i) => (
              <li key={c.tag} className={`rounded-xl p-3 text-sm transition ${active?.n === i + 1 ? "bg-purple-soft shadow-inset" : "bg-sand-light shadow-inset"}`}>
                <p className="flex items-center gap-2 font-semibold"><span className="grid h-5 w-5 place-items-center rounded-md bg-purple-deep text-[11px] text-onaccent">{i + 1}</span><span className="line-clamp-2">{c.paper_title}</span></p>
                <p className="mt-0.5 text-xs text-ink-muted">{c.section} · page {c.page}</p>
                {prefs.showQuotes && <blockquote className="mt-2 border-l-2 border-purple pl-2 text-xs italic text-ink-muted">“{c.quote}”</blockquote>}</li>))}</ol>)}
          {sourceTurn?.a && <div className="mt-3"><Badge tone="sand">trace {sourceTurn.a.trace_id.slice(0, 8)}</Badge></div>}
        </Card>
      </div>
    </div>
  );
}
