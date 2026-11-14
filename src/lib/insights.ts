import type { Contradiction, Gap, Paper, Topic, TrendRow } from "@/api/types";

export interface Insights {
  topTopic: { label: string; papers: number } | null;
  topMethod: { name: string; papers: number } | null;
  emerging: TrendRow[];
  gaps: Gap[];
  contradictions: number;
}

export function computeInsights(topics: Topic[], trends: TrendRow[], gaps: Gap[], contradictions: Contradiction[]): Insights {
  const top = [...topics].sort((a, b) => b.paper_ids.length - a.paper_ids.length)[0];
  const methods = trends.filter((t) => t.kind === "method").sort((a, b) => b.total - a.total);
  return {
    topTopic: top ? { label: top.label, papers: top.paper_ids.length } : null,
    topMethod: methods[0] ? { name: methods[0].key, papers: methods[0].total } : null,
    emerging: trends.filter((t) => t.emerging),
    gaps: [...gaps].sort((a, b) => b.score - a.score),
    contradictions: contradictions.length,
  };
}

export function papersByYear(papers: Paper[]): { year: string; papers: number }[] {
  const c = new Map<number, number>();
  for (const p of papers) if (p.year) c.set(p.year, (c.get(p.year) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => a[0] - b[0]).map(([y, n]) => ({ year: String(y), papers: n }));
}

export function topicDistribution(topics: Topic[]) {
  return topics.map((t) => ({ name: t.label, papers: t.paper_ids.length })).sort((a, b) => b.papers - a.papers);
}

export function methodDistribution(trends: TrendRow[], limit = 8) {
  return trends.filter((t) => t.kind === "method").sort((a, b) => b.total - a.total).slice(0, limit)
    .map((t) => ({ name: t.key, papers: t.total }));
}

/** counts per year per topic (for the topic evolution chart) */
export function topicEvolution(trends: TrendRow[], topicKeys: string[]) {
  const rows = trends.filter((t) => t.kind === "topic" && topicKeys.includes(t.key));
  const years = new Set<number>();
  rows.forEach((r) => Object.keys(r.counts_by_year).forEach((y) => years.add(+y)));
  return [...years].sort().map((y) => ({ year: String(y), ...Object.fromEntries(rows.map((r) => [r.key, r.counts_by_year[y] ?? 0])) }));
}

/** Topic x topic overlap: number of shared methods across their papers (from paper.methods). */
export function topicRelationships(topics: Topic[], papers: Paper[]) {
  const methodsOf = new Map(papers.map((p) => [p.id, new Set(p.methods.map((m) => m.toLowerCase()))]));
  const sets = topics.map((t) => {
    const s = new Set<string>();
    t.paper_ids.forEach((id) => methodsOf.get(id)?.forEach((m) => s.add(m)));
    return s;
  });
  return topics.flatMap((a, i) => topics.slice(i + 1).map((b, j) => {
    const shared = [...sets[i]].filter((m) => sets[i + 1 + j].has(m));
    return { a: a.label, b: b.label, shared };
  })).filter((r) => r.shared.length).sort((x, y) => y.shared.length - x.shared.length);
}
