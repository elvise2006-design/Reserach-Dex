import { Bell, ChevronDown, FileText, LogOut, Menu, Moon, Plus, Search, Settings as Cog, Sparkles, Sun, Upload } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useDebounced } from "@/hooks/useDebounced";
import { useResource } from "@/hooks/useResource";
import { cx, relTime } from "@/lib/format";
import { Logo } from "@/components/ui/Logo";

function useClickAway(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && cb();
    const k = (e: KeyboardEvent) => e.key === "Escape" && cb();
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [cb]);
  return ref;
}

function GlobalSearch() {
  const { api } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState(""); const [open, setOpen] = useState(false);
  const dq = useDebounced(q, 150).trim().toLowerCase();
  const papers = useResource((c) => api.papers.list(c));
  const topics = useResource((c) => api.analytics.topics(c).catch(() => []));
  const ref = useClickAway(() => setOpen(false));
  const hits = useMemo(() => {
    if (!dq) return { p: [], t: [] };
    return {
      p: (papers.data ?? []).filter((p) => [p.title, p.filename, ...p.authors, ...p.methods].join(" ").toLowerCase().includes(dq)).slice(0, 5),
      t: (topics.data ?? []).filter((t) => t.label.toLowerCase().includes(dq)).slice(0, 3),
    };
  }, [dq, papers.data, topics.data]);
  const go = (to: string) => { setOpen(false); setQ(""); nav(to); };
  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
      <input className="field !pl-10" placeholder="Search papers, authors, methods, topics…" aria-label="Global research search" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && q.trim() && go(`/library?q=${encodeURIComponent(q.trim())}`)} />
      {open && dq && (
        <div className="card absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-auto p-2 animate-pop" role="listbox">
          {!hits.p.length && !hits.t.length && <p className="p-3 text-sm text-ink-muted">No matches for “{q}”.</p>}
          {hits.p.map((p) => <button key={p.id} role="option" aria-selected={false} onClick={() => go(`/library/${p.id}`)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sand-dark/40"><span className="font-medium">{p.title ?? p.filename}</span><span className="block text-xs text-ink-muted">Paper · {p.year ?? "n.d."}</span></button>)}
          {hits.t.map((t) => <button key={t.topic_id} role="option" aria-selected={false} onClick={() => go("/discover")} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sand-dark/40"><span className="font-medium">{t.label}</span><span className="block text-xs text-ink-muted">Topic · {t.paper_ids.length} papers</span></button>)}
          <button onClick={() => go(`/library?q=${encodeURIComponent(q.trim())}`)} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-purple-deep hover:bg-purple-soft/50">See all results in Library →</button>
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { api, readNotifs, markRead, prefs } = useApp();
  const [open, setOpen] = useState(false);
  const jobs = useResource((c) => api.jobs.list(c));
  const ref = useClickAway(() => setOpen(false));
  const items = useMemo(() => (jobs.data ?? []).filter((j) => (j.status === "failed" ? prefs.notifyErrors : j.type === "report" ? prefs.notifyReports : prefs.notifyJobs)).map((j) => ({
    id: j.id, when: j.created_at,
    text: j.status === "failed" ? `${j.type} job failed${j.error ? `: ${j.error}` : ""}` : j.status === "done" ? `${j.type === "ingest" ? "Paper processing" : j.type === "analytics" ? "Analytics" : "Report"} finished` : `${j.type} job ${j.status}`,
    bad: j.status === "failed",
  })), [jobs.data, prefs]);
  const unread = items.filter((i) => !readNotifs.has(i.id)).length;
  return (
    <div ref={ref} className="relative">
      <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => { setOpen(!open); if (!open) jobs.reload(); }} className="btn-secondary relative !p-2.5">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-purple-deep px-1 text-[10px] font-bold text-onaccent">{unread}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-80 max-w-[88vw] p-3 animate-pop">
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-forest-deep">Notifications</p>
            {unread > 0 && <button className="text-xs font-semibold text-purple-deep" onClick={() => markRead(items.map((i) => i.id))}>Mark all read</button>}</div>
          {!items.length ? <p className="py-6 text-center text-sm text-ink-muted">Nothing yet. Activity from uploads and reports shows up here.</p> : (
            <ul className="max-h-72 space-y-1 overflow-auto">{items.map((i) => (
              <li key={i.id} className={cx("rounded-lg px-3 py-2 text-sm", !readNotifs.has(i.id) && "bg-purple-soft/50")}>
                <span className={i.bad ? "text-bad" : ""}>{i.text}</span><span className="block text-xs text-ink-muted">{relTime(i.when)}</span></li>))}</ul>)}
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const nav = useNavigate(); const [open, setOpen] = useState(false); const ref = useClickAway(() => setOpen(false));
  const items = [{ l: "Upload papers", i: Upload, to: "/library?upload=1" }, { l: "Ask AI Researcher", i: Sparkles, to: "/ai" }, { l: "Generate report", i: FileText, to: "/reports?new=1" }];
  return (
    <div ref={ref} className="relative">
      <button className="btn-primary !px-3.5" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Quick actions</span></button>
      {open && <div role="menu" className="card absolute right-0 top-full z-40 mt-2 w-56 p-2 animate-pop">{items.map((a) => (
        <button key={a.l} role="menuitem" onClick={() => { setOpen(false); nav(a.to); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sand-dark/40"><a.i className="h-4 w-4 text-forest" />{a.l}</button>))}</div>}
    </div>
  );
}

/** One-click light/dark switch. Picks an explicit theme; "Match system" lives in Settings › Appearance. */
function ThemeToggle() {
  const { setPrefs } = useApp(); const dark = useTheme() === "dark";
  return (
    <button aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      onClick={() => setPrefs({ theme: dark ? "light" : "dark" })} className="btn-secondary !p-2.5">
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function ProfileMenu() {
  const { user, signOut, mode } = useApp(); const nav = useNavigate(); const [open, setOpen] = useState(false); const ref = useClickAway(() => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button aria-label="Profile menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-xl p-1 hover:bg-sand-dark/40">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold text-onaccent">{user?.email[0]?.toUpperCase()}</span><ChevronDown className="hidden h-4 w-4 text-ink-muted sm:block" />
      </button>
      {open && <div className="card absolute right-0 top-full z-40 mt-2 w-60 p-2 animate-pop">
        <div className="px-3 py-2"><p className="truncate text-sm font-semibold">{user?.email}</p><p className="text-xs text-ink-muted">{mode === "demo" ? "Demo session" : "Signed in"}</p></div>
        <button onClick={() => { setOpen(false); nav("/settings"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sand-dark/40"><Cog className="h-4 w-4" />Settings</button>
        <button onClick={() => signOut()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-bad hover:bg-bad/10"><LogOut className="h-4 w-4" />{mode === "demo" ? "Exit demo" : "Sign out"}</button>
      </div>}
    </div>
  );
}

export function TopBar({ onMenu }: { onMenu(): void }) {
  const { corpora, corpus, setCorpusId } = useApp();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-sand/90 px-4 py-3 backdrop-blur md:px-8">
      <button aria-label="Open navigation" className="btn-secondary !p-2.5 md:hidden" onClick={onMenu}><Menu className="h-[18px] w-[18px]" /></button>
      <div className="md:hidden"><Logo compact /></div>
      <GlobalSearch />
      {corpora.length > 1 && (
        <select aria-label="Research collection" className="field !w-auto max-w-[11rem] !py-2" value={corpus?.id} onChange={(e) => setCorpusId(e.target.value)}>
          {corpora.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      <div className="ml-auto flex items-center gap-2.5"><QuickActions /><ThemeToggle /><Notifications /><ProfileMenu /></div>
    </header>
  );
}
