import { Bell, Database, Palette, Settings2, Sparkles, User as UserIcon, Library, LogOut, Info, Monitor, Moon, Sun } from "lucide-react";
import type { ThemePref } from "@/lib/theme";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { Stats } from "@/api/types";
import { Badge, Button, Card, ConfirmModal, Field, PageHeader, ProgressBar, SectionTitle, Toggle } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { bytes, cx, errMsg } from "@/lib/format";

type Tab = "profile" | "account" | "ai" | "collection" | "notifications" | "storage" | "appearance";
const TABS: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: UserIcon }, { id: "account", label: "Account", icon: Settings2 }, { id: "ai", label: "AI preferences", icon: Sparkles },
  { id: "collection", label: "Collection", icon: Library }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "storage", label: "Storage", icon: Database }, { id: "appearance", label: "Appearance", icon: Palette },
];
const THEMES: { id: ThemePref; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "system", label: "System", icon: Monitor }, { id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon },
];
const Local = () => <Badge tone="sand">saved in this browser</Badge>;
const Unavailable = ({ children }: { children: ReactNode }) => <p className="flex items-start gap-2 rounded-xl bg-sand-light p-3 text-xs text-ink-muted shadow-inset"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{children}</p>;

export default function Settings() {
  const { api, user, mode, corpus, corpora, reloadCorpora, setCorpusId, signOut, prefs, setPrefs, toast, bump } = useApp();
  const [tab, setTab] = useState<Tab>("profile"); const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState(corpus?.name ?? ""); const [topic, setTopic] = useState(corpus?.topic ?? "");
  const [delOpen, setDelOpen] = useState(false); const [busy, setBusy] = useState(false); const [newName, setNewName] = useState("");
  useEffect(() => { setName(corpus?.name ?? ""); setTopic(corpus?.topic ?? ""); }, [corpus?.id, corpus?.name, corpus?.topic]);
  useEffect(() => { if (tab === "storage") api.system.stats().then(setStats).catch((e) => toast("error", errMsg(e))); }, [tab, api, toast]);

  async function run(fn: () => Promise<unknown>, ok: string) { setBusy(true); try { await fn(); toast("success", ok); await reloadCorpora(); bump(); } catch (e) { toast("error", errMsg(e)); } finally { setBusy(false); } }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Preferences marked “saved in this browser” are not sent to the server." />
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto md:flex-col">{TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
            className={cx("flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition", tab === t.id ? "bg-sand-card text-forest-deep shadow-inset" : "text-ink-muted hover:bg-sand-dark/40")}><t.icon className="h-4 w-4" />{t.label}</button>))}</nav>
        <Card className="space-y-5">
          {tab === "profile" && <><SectionTitle title="Profile" />
            <Field label="Email"><input className="field" readOnly value={user?.email ?? ""} /></Field>
            <Unavailable>The server stores only your email. Display name, role and institution are not supported yet.</Unavailable></>}
          {tab === "account" && <><SectionTitle title="Account" />
            <p className="text-sm">Signed in as <b>{user?.email}</b>{mode === "demo" && " (demo mode — no real account)"}.</p>
            <Button variant="danger" onClick={signOut}><LogOut className="h-4 w-4" />{mode === "demo" ? "Exit demo" : "Sign out"}</Button>
            <Unavailable>Changing password or deleting the account is not available in the API yet.</Unavailable></>}
          {tab === "ai" && <><SectionTitle title="AI preferences" right={<Local />} />
            <Toggle checked={prefs.showQuotes} onChange={(v) => setPrefs({ showQuotes: v })} label="Show source quotes" hint="Display the supporting quotation under each citation." />
            <Toggle checked={prefs.showSuggestions} onChange={(v) => setPrefs({ showSuggestions: v })} label="Show suggested questions" />
            <Unavailable>Answer length and model choice are fixed by the server; every answer is checked against the sources.</Unavailable></>}
          {tab === "collection" && <><SectionTitle title="Collection settings" />
            {!corpus ? <p className="text-sm text-ink-muted">No collection selected.</p> : <>
              <Field label="Collection name"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Research topic"><input className="field" value={topic} onChange={(e) => setTopic(e.target.value)} /></Field>
              <div className="flex flex-wrap gap-2"><Button variant="primary" disabled={busy || !name.trim()} onClick={() => run(() => api.corpora.patch(corpus.id, { name: name.trim(), topic }), "Collection updated.")}>Save changes</Button>
                <Button variant="danger" disabled={corpora.length < 2} onClick={() => setDelOpen(true)}>Delete collection</Button></div>
              {corpora.length < 2 && <p className="text-xs text-ink-muted">Create another collection before deleting this one.</p>}</>}
            <div className="border-t border-sand-dark/60 pt-4"><Field label="New collection"><div className="flex gap-2"><input className="field" placeholder="Collection name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button disabled={busy || !newName.trim()} onClick={() => run(async () => { const c = await api.corpora.create(newName.trim()); setNewName(""); setCorpusId(c.id); }, "Collection created.")}>Create</Button></div></Field></div></>}
          {tab === "notifications" && <><SectionTitle title="Notifications" right={<Local />} />
            <Toggle checked={prefs.notifyJobs} onChange={(v) => setPrefs({ notifyJobs: v })} label="Processing complete" />
            <Toggle checked={prefs.notifyReports} onChange={(v) => setPrefs({ notifyReports: v })} label="Report ready" />
            <Toggle checked={prefs.notifyErrors} onChange={(v) => setPrefs({ notifyErrors: v })} label="Errors" />
            <Unavailable>These control in-app alerts only. Email and push notifications are not implemented.</Unavailable></>}
          {tab === "storage" && <><SectionTitle title="Storage & usage" />
            {!stats ? <p className="text-sm text-ink-muted">Loading…</p> : <>
              <ul className="grid grid-cols-2 gap-3 text-sm">{([["Collections", stats.corpora], ["Papers", stats.papers], ["Analysed", stats.extracted], ["Active jobs", stats.jobs_active]] as const).map(([l, v]) => <li key={l} className="rounded-xl bg-sand-light p-3 shadow-inset"><p className="text-xl font-extrabold text-forest-deep">{v}</p><p className="text-xs text-ink-muted">{l}</p></li>)}</ul>
              <div><p className="mb-1 text-sm">Uploaded PDFs: <b>{bytes(stats.storage_bytes)}</b></p><ProgressBar value={Math.min(1, stats.storage_bytes / (500 * 1024 * 1024))} /><p className="mt-1 text-xs text-ink-muted">Bar shown against an illustrative 500 MB reference, not an enforced quota.</p></div></>}</>}
          {tab === "appearance" && <><SectionTitle title="Appearance & accessibility" right={<Local />} />
            <div><p className="label mb-1.5 block">Theme</p>
              <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2 rounded-2xl bg-sand-light p-1.5 shadow-inset">{THEMES.map((t) => (
                <button key={t.id} role="radio" aria-checked={prefs.theme === t.id} onClick={() => setPrefs({ theme: t.id })}
                  className={cx("flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition", prefs.theme === t.id ? "bg-sand-card text-forest-deep shadow-raised-sm" : "text-ink-muted hover:text-ink")}>
                  <t.icon className="h-4 w-4" />{t.label}</button>))}</div>
              <p className="mt-1.5 text-xs text-ink-muted">{prefs.theme === "system" ? "Follows your device’s light or dark setting." : prefs.theme === "dark" ? "Deep forest night." : "Warm sand."}</p></div>
            <Field label={`Neumorphism intensity (${Math.round(prefs.neumorphism * 100)}%)`}><input type="range" min={0} max={1.5} step={0.25} value={prefs.neumorphism} aria-label="Neumorphism intensity" onChange={(e) => setPrefs({ neumorphism: +e.target.value })} className="w-full accent-forest" /></Field>
            <Toggle checked={prefs.density === "compact"} onChange={(v) => setPrefs({ density: v ? "compact" : "comfortable" })} label="Compact density" />
            <Toggle checked={prefs.largeText} onChange={(v) => setPrefs({ largeText: v })} label="Larger text" />
            <Toggle checked={prefs.reduceMotion} onChange={(v) => setPrefs({ reduceMotion: v })} label="Reduce motion" /></>}
        </Card>
      </div>
      <ConfirmModal open={delOpen} title="Delete this collection?" text={`“${corpus?.name}”, all its papers, analytics and reports will be permanently deleted.`} busy={busy}
        onConfirm={() => run(async () => { if (corpus) await api.corpora.remove(corpus.id); setDelOpen(false); }, "Collection deleted.")} onClose={() => setDelOpen(false)} />
    </div>
  );
}
