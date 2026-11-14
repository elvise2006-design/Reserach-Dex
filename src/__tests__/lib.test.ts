import { describe, expect, it } from "vitest";
import type { Answer, Gap, GraphData, Paper, Topic, TrendRow } from "@/api/types";
import { chipifyTags, relatedQuestions, toFindings } from "@/lib/answers";
import { buildGraph, DEFAULT_ON, neighbours, searchGraph, visibleSubgraph } from "@/lib/graph";
import { computeInsights, methodDistribution, papersByYear, topicEvolution, topicRelationships } from "@/lib/insights";
import { bytes, pct, relTime, truncate } from "@/lib/format";

const cite = (tag: string) => ({ tag, paper_title: "Paper A", section: "results", page: 3, quote: "q" });

describe("answers", () => {
  const a: Pick<Answer, "answer" | "citations"> = {
    answer: "Method X reaches 91.2 on D [p1:results:3]. Method Y is lower [p2:results:4][p1:results:3].",
    citations: [cite("p1:results:3"), cite("p2:results:4")],
  };
  it("splits into numbered findings with citation indexes and strips raw tags", () => {
    const f = toFindings(a);
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ n: 1, refs: [1] });
    expect(f[1].refs).toEqual([2, 1]);
    expect(f.every((x) => !x.text.includes("["))).toBe(true);
  });
  it("chipifies report tags", () => expect(chipifyTags("see [abcdefgh:results:3].")).toBe("see `abcdef·results·p3`."));
  it("suggests follow-ups only from cited papers", () => {
    expect(relatedQuestions([])).toEqual([]);
    expect(relatedQuestions([cite("x:y:1")]).length).toBeGreaterThan(0);
  });
});

describe("insights", () => {
  const topics: Topic[] = [
    { topic_id: 0, label: "A, b", terms: [], paper_ids: ["1", "2", "3"], papers: [] },
    { topic_id: 1, label: "C, d", terms: [], paper_ids: ["3"], papers: [] },
  ];
  const trends: TrendRow[] = [
    { key: "cnn", kind: "method", counts_by_year: { "2022": 1, "2023": 3 }, total: 4, cagr: 2, emerging: true },
    { key: "svm", kind: "method", counts_by_year: { "2022": 1 }, total: 1, cagr: null, emerging: false },
    { key: "A, b", kind: "topic", counts_by_year: { "2022": 1, "2023": 2 }, total: 3, cagr: 1, emerging: false },
  ];
  it("computes insights from data only", () => {
    const i = computeInsights(topics, trends, [{ kind: "understudied_topic", description: "d", evidence_papers: [], score: 1 } as Gap], []);
    expect(i.topTopic).toEqual({ label: "A, b", papers: 3 });
    expect(i.topMethod?.name).toBe("cnn");
    expect(i.emerging).toHaveLength(1);
    expect(i.contradictions).toBe(0);
  });
  it("handles empty input without inventing values", () => {
    const i = computeInsights([], [], [], []);
    expect(i.topTopic).toBeNull(); expect(i.topMethod).toBeNull();
  });
  it("aggregates", () => {
    expect(methodDistribution(trends)[0]).toEqual({ name: "cnn", papers: 4 });
    expect(papersByYear([{ year: 2023 }, { year: 2022 }, { year: null }, { year: 2023 }] as Paper[])).toEqual([{ year: "2022", papers: 1 }, { year: "2023", papers: 2 }]);
    expect(topicEvolution(trends, ["A, b"])).toEqual([{ year: "2022", "A, b": 1 }, { year: "2023", "A, b": 2 }]);
  });
  it("finds topic relationships via shared methods", () => {
    const papers = [{ id: "1", methods: ["CNN"] }, { id: "3", methods: ["cnn"] }] as Paper[];
    const r = topicRelationships(topics, papers);
    expect(r).toHaveLength(1); expect(r[0].shared).toEqual(["cnn"]);
  });
});

describe("graph", () => {
  const g: GraphData = {
    nodes: [{ id: "paper:1", kind: "Paper", title: "P1" }, { id: "topic:0", kind: "Topic", label: "T" }, { id: "method:m", kind: "Method", name: "M" }, { id: "author:a", kind: "Author", name: "Al" }],
    edges: [{ source: "paper:1", target: "topic:0", rel: "ABOUT" }, { source: "paper:1", target: "method:m", rel: "USES" }, { source: "paper:1", target: "author:a", rel: "AUTHORED_BY" }],
  };
  const all = buildGraph(g, [], [{ id: "1", title: "P1", abstract: "", authors: [], methods: [], topics: [] } as unknown as Paper]);
  it("maps kinds to categories and hides disabled ones", () => {
    expect(all.nodes.find((n) => n.id === "author:a")?.category).toBe("Author");
    const v = visibleSubgraph(all, new Set(DEFAULT_ON), new Set());
    expect(v.nodes.some((n) => n.category === "Author")).toBe(false);
    expect(v.edges.every((e) => v.nodes.some((n) => n.id === e.source) && v.nodes.some((n) => n.id === e.target))).toBe(true);
  });
  it("expand reveals hidden neighbours", () => {
    const v = visibleSubgraph(all, new Set(DEFAULT_ON), new Set(["paper:1"]));
    expect(v.nodes.some((n) => n.category === "Author")).toBe(true);
  });
  it("neighbours and search", () => {
    expect(neighbours(all.edges, "paper:1")).toHaveLength(3);
    expect(searchGraph(all, "uses").edges.size).toBe(1);
    expect(searchGraph(all, "").nodes.size).toBe(0);
  });
});

describe("format", () => {
  it("formats", () => {
    expect(bytes(1536)).toMatch(/1\.5/); expect(pct(0.5)).toBe("+50%"); expect(pct(null)).toBe("n/a");
    expect(truncate("abcdef", 4)).toBe("abc…");
    expect(relTime(new Date(Date.now() - 3 * 3600_000).toISOString())).toMatch(/3/);
  });
});
