import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import type { Gap, GraphData, Paper } from "@/api/types";

export type Category = "Topic" | "Paper" | "Method" | "Author" | "Dataset" | "Metric" | "Finding" | "Limitation" | "Gap";
export const CATEGORIES: Category[] = ["Topic", "Paper", "Method", "Finding", "Gap", "Author", "Dataset", "Metric", "Limitation"];
export const DEFAULT_ON: Category[] = ["Topic", "Paper", "Method", "Gap", "Finding"];

export interface GNode { id: string; category: Category; label: string; detail: string; paperId?: string }
export interface GEdge { id: string; source: string; target: string; rel: string }

const KIND: Record<string, Category> = {
  Topic: "Topic", Paper: "Paper", Method: "Method", Author: "Author", Dataset: "Dataset", Metric: "Metric",
  Claim: "Finding", Limitation: "Limitation",
};

export function buildGraph(g: GraphData, gaps: Gap[], papers: Paper[]): { nodes: GNode[]; edges: GEdge[] } {
  const titles = new Map(papers.map((p) => [p.id, p.title ?? p.filename]));
  const nodes: GNode[] = g.nodes.filter((n) => KIND[n.kind]).map((n) => {
    const cat = KIND[n.kind];
    const raw = n.id.slice(n.id.indexOf(":") + 1);
    const paperId = cat === "Paper" ? raw : undefined;
    const label = cat === "Paper" ? String(n.title ?? titles.get(raw) ?? raw)
      : cat === "Finding" || cat === "Limitation" ? String(n.text ?? raw) : raw;
    const detail = cat === "Topic" ? `Terms: ${((n.terms as string[]) ?? []).join(", ")}`
      : cat === "Paper" ? `${n.year ?? "n.d."}` : cat === "Finding" ? String(n.tag ?? "") : "";
    return { id: n.id, category: cat, label, detail, paperId };
  });
  const have = new Set(nodes.map((n) => n.id));
  const edges: GEdge[] = g.edges.filter((e) => have.has(e.source) && have.has(e.target))
    .map((e, i) => ({ id: `${e.source}>${e.target}:${e.rel}:${i}`, source: e.source, target: e.target, rel: e.rel }));
  gaps.slice(0, 12).forEach((gap, i) => {
    const id = `gap:${i}`;
    nodes.push({ id, category: "Gap", label: gap.description, detail: gap.kind.replace(/_/g, " ") });
    gap.evidence_papers.slice(0, 4).forEach((pid) => {
      if (have.has(`paper:${pid}`)) edges.push({ id: `${id}>${pid}`, source: id, target: `paper:${pid}`, rel: "EVIDENCED_BY" });
    });
  });
  return { nodes, edges };
}

/** Visible = enabled categories plus nodes revealed by "expand". Edges need both endpoints visible. */
export function visibleSubgraph(all: { nodes: GNode[]; edges: GEdge[] }, on: Set<Category>, expanded: Set<string>) {
  const show = new Set(all.nodes.filter((n) => on.has(n.category)).map((n) => n.id));
  for (const id of expanded) {
    show.add(id);
    for (const e of all.edges) { if (e.source === id) show.add(e.target); if (e.target === id) show.add(e.source); }
  }
  return {
    nodes: all.nodes.filter((n) => show.has(n.id)),
    edges: all.edges.filter((e) => show.has(e.source) && show.has(e.target)),
  };
}

type Nb = { id: string; rel: string; dir: "out" | "in" };
export function neighbours(edges: GEdge[], id: string): Nb[] {
  return edges.flatMap<Nb>((e) => (e.source === id ? [{ id: e.target, rel: e.rel, dir: "out" as const }]
    : e.target === id ? [{ id: e.source, rel: e.rel, dir: "in" as const }] : []));
}

export type Positions = Map<string, { x: number; y: number }>;

/** Force layout; previously placed nodes start where they were so the graph does not jump. */
export function layout(nodes: GNode[], edges: GEdge[], prev: Positions): Positions {
  type SN = { id: string; x: number; y: number };
  const sim: SN[] = nodes.map((n, i) => {
    const p = prev.get(n.id);
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    return { id: n.id, x: p?.x ?? Math.cos(a) * 260, y: p?.y ?? Math.sin(a) * 260 };
  });
  const links = edges.map((e) => ({ source: e.source, target: e.target }));
  const s = forceSimulation(sim)
    .force("link", forceLink(links).id((d) => (d as SN).id).distance(150).strength(0.6))
    .force("charge", forceManyBody().strength(-420))
    .force("collide", forceCollide(80))
    .force("center", forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 220; i++) s.tick();
  return new Map(sim.map((n) => [n.id, { x: n.x, y: n.y }]));
}

export function searchGraph(all: { nodes: GNode[]; edges: GEdge[] }, q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return { nodes: new Set<string>(), edges: new Set<string>() };
  const nodes = new Set(all.nodes.filter((n) => n.label.toLowerCase().includes(t) || n.category.toLowerCase().includes(t)).map((n) => n.id));
  const edges = new Set(all.edges.filter((e) => e.rel.toLowerCase().replace(/_/g, " ").includes(t) || (nodes.has(e.source) && nodes.has(e.target))).map((e) => e.id));
  return { nodes, edges };
}
