import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { demoApi } from "@/api/demo";
import { liveApi } from "@/api/live";
import type { Api, Corpus, User } from "@/api/types";
import { errMsg } from "@/lib/format";
import { usePrefsState, type Prefs } from "@/lib/prefs";

export type ToastKind = "success" | "error" | "info";
export interface Toast { id: number; kind: ToastKind; text: string }
type Mode = "live" | "demo";

interface Ctx {
  api: Api; mode: Mode; user: User | null; booting: boolean;
  signIn(email: string, password: string, signup?: boolean): Promise<void>;
  enterDemo(): Promise<void>; signOut(): Promise<void>;
  corpora: Corpus[]; corpus: Corpus | null; setCorpusId(id: string): void; reloadCorpora(): Promise<void>;
  version: number; bump(): void;
  toasts: Toast[]; toast(kind: ToastKind, text: string): void; dismiss(id: number): void;
  prefs: Prefs; setPrefs(p: Partial<Prefs>): void;
  readNotifs: Set<string>; markRead(ids: string[]): void;
}
const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C); if (!c) throw new Error("AppProvider missing"); return c; };

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("rdx_mode") as Mode) || "live");
  const api = mode === "demo" ? demoApi : liveApi;
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [corpusId, setCorpusIdState] = useState<string | null>(() => localStorage.getItem("rdx_corpus"));
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [prefs, setPrefs] = usePrefsState();
  const [readNotifs, setRead] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("rdx_read") ?? "[]")));
  const tid = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
  }, [dismiss]);

  const reloadCorpora = useCallback(async () => {
    let list = await api.corpora.list();
    if (!list.length && api.mode === "live") list = [await api.corpora.create("My research", "")];
    setCorpora(list);
    setCorpusIdState((cur) => (cur && list.some((c) => c.id === cur) ? cur : list[0]?.id ?? null));
  }, [api]);

  useEffect(() => {
    let alive = true;
    setBooting(true);
    api.auth.me().then(async (u) => {
      if (!alive) return;
      setUser(u);
      if (u) await reloadCorpora().catch((e) => toast("error", errMsg(e)));
    }).finally(() => alive && setBooting(false));
    return () => { alive = false; };
  }, [api, reloadCorpora, toast]);

  useEffect(() => { if (corpusId) localStorage.setItem("rdx_corpus", corpusId); }, [corpusId]);

  const value = useMemo<Ctx>(() => ({
    api, mode, user, booting,
    async signIn(email, password, signup) {
      const u = signup ? await liveApi.auth.signup(email, password) : await liveApi.auth.login(email, password);
      localStorage.setItem("rdx_mode", "live"); setMode("live"); setUser(u);
      await liveApi.corpora.list().then(async (l) => {
        const list = l.length ? l : [await liveApi.corpora.create("My research", "")];
        setCorpora(list); setCorpusIdState(list[0].id);
      });
    },
    async enterDemo() {
      localStorage.setItem("rdx_mode", "demo"); setMode("demo");
      const u = await demoApi.auth.login("", ""); setUser(u);
      const l = await demoApi.corpora.list(); setCorpora(l); setCorpusIdState(l[0].id);
    },
    async signOut() {
      await api.auth.logout(); setUser(null); setCorpora([]);
      localStorage.setItem("rdx_mode", "live"); setMode("live");
    },
    corpora, corpus: corpora.find((c) => c.id === corpusId) ?? null,
    setCorpusId: setCorpusIdState, reloadCorpora,
    version, bump: () => setVersion((v) => v + 1),
    toasts, toast, dismiss, prefs, setPrefs,
    readNotifs, markRead(ids) {
      setRead((s) => { const n = new Set([...s, ...ids]); localStorage.setItem("rdx_read", JSON.stringify([...n])); return n; });
    },
  }), [api, mode, user, booting, corpora, corpusId, version, toasts, toast, dismiss, prefs, setPrefs, readNotifs, reloadCorpora]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
