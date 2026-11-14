// Mirrors backend/app/schemas/api.py and docs/api-contract.md. Keep in sync with the backend.
export type PaperStatus = "uploaded" | "parsing" | "parsed" | "extracted" | "failed";
export type JobType = "ingest" | "analytics" | "report";
export type JobStatus = "queued" | "running" | "done" | "failed";
export type ReportKind =
  | "landscape" | "methodology" | "gaps" | "literature_review" | "contradictions" | "topic_relationships";

export interface User { id: string; email: string }
export interface Corpus { id: string; name: string; topic: string | null; created_at: string; paper_count: number }
export interface Paper {
  id: string; corpus_id: string; filename: string; title: string | null; year: number | null;
  status: PaperStatus; parse_quality: number | null; retry_count: number; error: string | null;
  authors: string[]; abstract: string; created_at: string | null; topics: string[]; methods: string[];
}
export interface SourceSpan { paper_id: string; section: string; page: number; char_start: number; char_end: number }
export interface ResultItem {
  dataset: string; metric: string; split: string | null; value: number; unit: string | null;
  method: string | null; source: SourceSpan;
}
export interface Extraction {
  paper_id: string; problem: string; methods: string[]; datasets: string[]; metrics: string[];
  results: ResultItem[]; limitations: string[]; future_work: string[];
  unverified: string[]; errors: string[]; prompt_version: string; model: string;
}
export interface Claim { claim_id: string; text: string; source: SourceSpan | null }
export interface PaperDetail extends Paper { extraction: Extraction | null; claims: Claim[] }
export interface Job {
  id: string; type: JobType; status: JobStatus; progress: number; error: string | null;
  result: Record<string, unknown>; corpus_id?: string | null; created_at?: string; finished_at?: string | null;
}
export interface UploadResult { job: Job | null; accepted: Paper[]; duplicates: string[] }
export interface Page<T> { items: T[]; total: number; limit: number; offset: number }

export interface Topic { topic_id: number; label: string; terms: string[]; paper_ids: string[]; papers: { id: string; title: string }[] }
export interface Cluster { cluster_id: number; members: { id: string; title: string }[] }
export interface TrendRow {
  key: string; kind: "topic" | "method"; counts_by_year: Record<string, number>; total: number;
  cagr: number | null; emerging: boolean;
}
export interface Gap { kind: "untested_pair" | "recurring_limitation" | "understudied_topic"; description: string; evidence_papers: string[]; score: number }
export interface Evidence { claim_id: string; paper_id: string | null; paper_title: string | null; text: string | null; source: SourceSpan | null; tag: string | null }
export interface Contradiction {
  status: "candidate"; confidence: number; nli_score: number; judge_score: number; rationale: string; evidence: [Evidence, Evidence];
}
export interface GraphNode { id: string; kind: string; [k: string]: unknown }
export interface GraphEdge { source: string; target: string; rel: string; key?: number; [k: string]: unknown }
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }
export interface CompareGroup {
  dataset: string; metric: string; split: string | null; lower_is_better: boolean;
  rows: { paper_id: string; method: string | null; value: number; unit: string | null; tag: string }[];
}
export interface Citation { tag: string; paper_title: string; section: string; page: number; quote: string }
export interface Answer { answer: string; citations: Citation[]; grounded_ratio: number; trace_id: string }
export interface ReportMeta {
  id: string; corpus_id: string; kind: ReportKind; title: string; status: string; paper_count: number;
  created_at: string; has_pdf: boolean; error: string | null;
}
export interface ReportDetail extends ReportMeta { markdown: string | null }
export interface Stats { corpora: number; papers: number; extracted: number; storage_bytes: number; jobs_active: number }
export interface Health { ok: boolean; detail: string }

export interface Api {
  mode: "live" | "demo";
  auth: {
    login(email: string, password: string): Promise<User>;
    signup(email: string, password: string): Promise<User>;
    logout(): Promise<void>;
    me(): Promise<User | null>;
  };
  corpora: {
    list(): Promise<Corpus[]>; create(name: string, topic?: string): Promise<Corpus>;
    patch(id: string, p: { name?: string; topic?: string }): Promise<Corpus>; remove(id: string): Promise<void>;
  };
  papers: {
    list(corpusId: string): Promise<Paper[]>; get(id: string): Promise<PaperDetail>;
    upload(corpusId: string, files: File[]): Promise<UploadResult>; remove(id: string): Promise<void>;
    pdfUrl(id: string): Promise<string | null>;
  };
  jobs: { get(id: string): Promise<Job>; list(corpusId: string): Promise<Job[]> };
  analytics: {
    topics(c: string): Promise<Topic[]>; clusters(c: string): Promise<Cluster[]>; trends(c: string): Promise<TrendRow[]>;
    gaps(c: string): Promise<Gap[]>; graph(c: string): Promise<GraphData>; contradictions(c: string): Promise<Contradiction[]>;
    compare(c: string, dataset?: string, metric?: string): Promise<CompareGroup[]>; run(c: string): Promise<Job>;
  };
  qa: { ask(corpusId: string, question: string): Promise<Answer>; suggested(corpusId: string): string[] };
  reports: {
    list(c: string): Promise<ReportMeta[]>; get(id: string): Promise<ReportDetail>;
    create(c: string, kind: ReportKind): Promise<{ job: Job; report_id: string }>; remove(id: string): Promise<void>;
    download(id: string, format: "pdf" | "md", title: string): Promise<void>;
  };
  system: { stats(): Promise<Stats>; health(): Promise<Health> };
}
