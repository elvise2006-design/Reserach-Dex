import { json, publicJson, raw, saveBlob, tokens } from "./http";
import type { Api, Answer, Corpus, Job, Page, Paper, ReportDetail, ReportMeta, User } from "./types";

const q = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]);
  return p.size ? `?${p}` : "";
};
const SUGGESTED = [
  "What are the most commonly used methodologies?",
  "What are the major limitations identified across these papers?",
  "Are there contradictions between experimental findings?",
  "What research gaps remain unexplored?",
  "Compare reported results across papers",
  "How have research topics evolved over time?",
];

export const liveApi: Api = {
  mode: "live",
  auth: {
    async login(email, password) {
      const t = await publicJson<{ access_token: string; refresh_token: string }>("/api/auth/login", { email, password });
      tokens.set(t.access_token, t.refresh_token);
      return json<User>("/api/auth/me");
    },
    async signup(email, password) {
      await publicJson<User>("/api/auth/signup", { email, password });
      return liveApi.auth.login(email, password);
    },
    async logout() {
      const r = tokens.refresh;
      if (r) await json("/api/auth/logout", { method: "POST", body: { refresh_token: r } }).catch(() => undefined);
      tokens.clear();
    },
    async me() {
      if (!tokens.access && !tokens.refresh) return null;
      try { return await json<User>("/api/auth/me"); } catch { tokens.clear(); return null; }
    },
  },
  corpora: {
    list: async () => (await json<Page<Corpus>>("/api/corpora?limit=200")).items,
    create: (name, topic) => json<Corpus>("/api/corpora", { method: "POST", body: { name, topic } }),
    patch: (id, p) => json<Corpus>(`/api/corpora/${id}`, { method: "PATCH", body: p }),
    remove: (id) => json<void>(`/api/corpora/${id}`, { method: "DELETE" }),
  },
  papers: {
    list: async (c) => (await json<Page<Paper>>(`/api/corpora/${c}/papers?limit=200`)).items,
    get: (id) => json(`/api/papers/${id}`),
    upload(c, files) {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      return json(`/api/corpora/${c}/papers`, { method: "POST", body: fd });
    },
    remove: (id) => json<void>(`/api/papers/${id}`, { method: "DELETE" }),
    async pdfUrl(id) {
      const res = await raw(`/api/papers/${id}/file`);
      return URL.createObjectURL(await res.blob());
    },
  },
  jobs: { get: (id) => json<Job>(`/api/jobs/${id}`), list: (c) => json<Job[]>(`/api/jobs?corpus_id=${c}&limit=30`) },
  analytics: {
    topics: (c) => json(`/api/corpora/${c}/topics`), clusters: (c) => json(`/api/corpora/${c}/clusters`),
    trends: (c) => json(`/api/corpora/${c}/trends`), gaps: (c) => json(`/api/corpora/${c}/gaps`),
    graph: (c) => json(`/api/corpora/${c}/graph`), contradictions: (c) => json(`/api/corpora/${c}/contradictions`),
    compare: (c, dataset, metric) => json(`/api/corpora/${c}/compare${q({ dataset, metric })}`),
    run: (c) => json<Job>(`/api/corpora/${c}/analytics`, { method: "POST" }),
  },
  qa: {
    ask: (c, question) => json<Answer>(`/api/corpora/${c}/ask`, { method: "POST", body: { question } }),
    suggested: () => SUGGESTED,
  },
  reports: {
    list: async (c) => (await json<Page<ReportMeta>>(`/api/corpora/${c}/reports?limit=100`)).items,
    get: (id) => json<ReportDetail>(`/api/reports/${id}`),
    create: (c, kind) => json(`/api/corpora/${c}/report`, { method: "POST", body: { kind } }),
    remove: (id) => json<void>(`/api/reports/${id}`, { method: "DELETE" }),
    async download(id, format, title) {
      const res = await raw(`/api/reports/${id}/download?format=${format}`);
      saveBlob(await res.blob(), `${title.replace(/[^\w\-]+/g, "_")}.${format}`);
    },
  },
  system: {
    stats: () => json("/api/stats"),
    async health() {
      try {
        const r = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined) ?? ""}/ready`);
        const b = await r.json();
        return { ok: r.ok, detail: r.ok ? "All systems operational" : `Degraded: ${JSON.stringify(b)}` };
      } catch { return { ok: false, detail: "Backend unreachable" }; }
    },
  },
};
