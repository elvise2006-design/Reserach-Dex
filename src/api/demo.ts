// Demo mode: serves SYNTHETIC sample data (8 invented papers) exported from the real ml pipeline with a
// scripted test LLM. Nothing here is a real research finding. Uploads are simulated and never analysed.
import raw from "./demo/demoData.json";
import { ApiError, saveBlob } from "./http";
import type {
  Answer, Api, Corpus, Job, Paper, PaperDetail, ReportDetail, ReportKind, ReportMeta, User,
} from "./types";

const D = raw as any;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const delay = <T,>(v: T, ms = 220) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const USER_KEY = "rdx_demo_user";

let papers: Paper[] = clone(D.papers);
let reports: ReportDetail[] = clone(D.reports);
let corpus: Corpus = clone(D.corpus);
let seq = 0;

export const DEMO_LABEL = "Sample data — 8 invented papers analysed by the real pipeline with a scripted test model. Not real findings.";

function words(s: string) { return new Set(s.toLowerCase().match(/[a-z0-9\-]{3,}/g) ?? []); }

export const demoApi: Api = {
  mode: "demo",
  auth: {
    async login() { localStorage.setItem(USER_KEY, "1"); return delay({ id: "demo", email: "demo@researchdex.local" } as User); },
    async signup() { return demoApi.auth.login("", ""); },
    async logout() { localStorage.removeItem(USER_KEY); },
    async me() { return localStorage.getItem(USER_KEY) ? { id: "demo", email: "demo@researchdex.local" } : null; },
  },
  corpora: {
    list: () => delay([clone({ ...corpus, paper_count: papers.length })]),
    create: () => { throw new ApiError(400, "demo", "Creating collections is disabled in demo mode"); },
    async patch(_id, p) { corpus = { ...corpus, ...p } as Corpus; return clone(corpus); },
    remove: () => { throw new ApiError(400, "demo", "Deleting the sample collection is disabled in demo mode"); },
  },
  papers: {
    list: () => delay(clone(papers)),
    async get(id) {
      const d = D.paperDetails[id] ?? { ...papers.find((p) => p.id === id), extraction: null, claims: [] };
      if (!d?.id) throw new ApiError(404, "not_found", "Paper not found");
      return delay(clone(d) as PaperDetail);
    },
    async upload(_c, files) {
      const accepted: Paper[] = files.map((f) => ({
        id: `demo-up-${++seq}`, corpus_id: "demo", filename: f.name, title: f.name.replace(/\.pdf$/i, ""), year: null,
        status: "extracted", parse_quality: null, retry_count: 0, error: null, authors: [],
        abstract: "Demo mode: this file was NOT analysed. Connect the backend to analyse real papers.",
        created_at: new Date().toISOString(), topics: [], methods: [],
      }));
      papers = [...papers, ...accepted];
      return delay({ job: { id: "demo-job", type: "ingest", status: "done", progress: 1, error: null, result: {} } as Job, accepted, duplicates: [] }, 1400);
    },
    async remove(id) { papers = papers.filter((p) => p.id !== id); },
    async pdfUrl() { return null; },
  },
  jobs: {
    get: async () => ({ id: "demo-job", type: "ingest", status: "done", progress: 1, error: null, result: {} }) as Job,
    list: () => delay(papers.slice(-4).reverse().map((p, i) => ({
      id: `demo-j${i}`, type: "ingest", status: "done", progress: 1, error: null, result: {}, created_at: p.created_at ?? undefined,
    } as Job))),
  },
  analytics: {
    topics: () => delay(clone(D.topics)), clusters: () => delay(clone(D.clusters)), trends: () => delay(clone(D.trends)),
    gaps: () => delay(clone(D.gaps)), graph: () => delay(clone(D.graph)), contradictions: () => delay(clone(D.contradictions)),
    async compare(_c, dataset, metric) {
      return delay(clone(D.compare).filter((g: any) =>
        (!dataset || g.dataset.includes(dataset.toLowerCase())) && (!metric || g.metric.includes(metric.toLowerCase()))));
    },
    run: async () => ({ id: "demo-job", type: "analytics", status: "done", progress: 1, error: null, result: {} }) as Job,
  },
  qa: {
    async ask(_c, question) {
      const known = D.asks as Record<string, Answer>;
      if (known[question]) return delay(clone(known[question]), 1100);
      const qw = words(question);
      let best: [number, string] = [0, ""];
      for (const k of Object.keys(known)) {
        const s = [...words(k)].filter((w) => qw.has(w)).length;
        if (s > best[0]) best = [s, k];
      }
      if (best[0] >= 2) return delay(clone(known[best[1]]), 1100);
      return delay({
        answer: "Demo mode only answers the suggested sample questions. Connect the backend to ask your own questions.",
        citations: [], grounded_ratio: 1, trace_id: "demo",
      }, 700);
    },
    suggested: () => D.suggestedQuestions as string[],
  },
  reports: {
    list: () => delay(reports.map(({ markdown: _m, ...meta }) => clone(meta) as ReportMeta)),
    async get(id) {
      const r = reports.find((x) => x.id === id);
      if (!r) throw new ApiError(404, "not_found", "Report not found");
      return delay(clone(r));
    },
    async create(_c, kind: ReportKind) {
      const base = (D.reports as ReportDetail[]).find((r) => r.kind === kind)!;
      const id = `demo-report-new-${++seq}`;
      reports = [{ ...clone(base), id, created_at: new Date().toISOString() }, ...reports];
      return delay({ job: { id: "demo-job", type: "report", status: "done", progress: 1, error: null, result: { report_id: id } } as Job, report_id: id }, 1500);
    },
    async remove(id) { reports = reports.filter((r) => r.id !== id); },
    async download(id, format, title) {
      if (format === "pdf") throw new ApiError(400, "demo", "PDF export needs the real backend. Markdown works in demo mode.");
      const r = reports.find((x) => x.id === id);
      saveBlob(new Blob([r?.markdown ?? ""], { type: "text/markdown" }), `${title.replace(/[^\w\-]+/g, "_")}.md`);
    },
  },
  system: {
    stats: async () => ({ corpora: 1, papers: papers.length, extracted: papers.length, storage_bytes: 0, jobs_active: 0 }),
    health: async () => ({ ok: true, detail: "Demo mode — no backend connected" }),
  },
};
