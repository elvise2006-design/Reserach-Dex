import { Background, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useResource } from "@/hooks/useResource";
import { useDebounced } from "@/hooks/useDebounced";
import { usePalette, useTheme, type Palette } from "@/lib/theme";
import { buildGraph, CATEGORIES, DEFAULT_ON, layout, neighbours, searchGraph, visibleSubgraph, type Category, type Positions } from "@/lib/graph";

const COLORS_LIGHT_TEXT = "#F3EDE1"; // cream text on the dark-mode Paper fill
const categoryColors = (c: Palette): Record<Category, string> => ({ Topic: c.forest, Paper: c.forestDeep, Method: c.purple, Finding: c.ok, Gap: c.warn, Author: c.faint, Dataset: c.purpleDeep, Metric: c.mint, Limitation: c.bad });

function Inner() {
  const { api } = useApp();
  const theme = useTheme(); const pal = usePalette(); const COLORS = useMemo(() => categoryColors(pal), [pal]);
  const g = useResource((c) => api.analytics.graph(c)); const gaps = useResource((c) => api.analytics.gaps(c)); const papers = useResource((c) => api.papers.list(c));
  const [on, setOn] = useState<Set<Category>>(new Set(DEFAULT_ON)); const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null); const [q, setQ] = useState(""); const dq = useDebounced(q);
  const pos = useRef<Positions>(new Map());
  const all = useMemo(() => (g.data && gaps.data && papers.data ? buildGraph(g.data, gaps.data, papers.data) : null), [g.data, gaps.data, papers.data]);
  const vis = useMemo(() => (all ? visibleSubgraph(all, on, expanded) : { nodes: [], edges: [] }), [all, on, expanded]);
  const hit = useMemo(() => (all ? searchGraph(all, dq) : { nodes: new Set<string>(), edges: new Set<string>() }), [all, dq]);
  const near = useMemo(() => new Set(selected && all ? [selected, ...neighbours(all.edges, selected).map((n) => n.id)] : []), [selected, all]);
  const [version, setVersion] = useState(0);
  const positions = useMemo(() => { const p = layout(vis.nodes, vis.edges, pos.current); pos.current = p; return p; }, [vis]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setVersion((v) => v + 1), [positions]);

  const searching = dq.trim().length > 0; const focus = selected ? near : searching ? hit.nodes : null;
  const nodes: Node[] = useMemo(() => vis.nodes.map((n) => {
    const p = positions.get(n.id) ?? { x: 0, y: 0 }; const dim = focus && !focus.has(n.id); const c = COLORS[n.category];
    return { id: n.id, position: p, data: { label: n.label.length > 28 ? n.label.slice(0, 27) + "…" : n.label, color: c }, ariaLabel: `${n.category}: ${n.label}`,
      style: { background: n.category === "Topic" || n.category === "Paper" ? c : pal.card, color: n.category === "Topic" || n.category === "Paper" ? (theme === "dark" && n.category === "Paper" ? COLORS_LIGHT_TEXT : pal.onaccent) : pal.ink,
        border: `2px solid ${c}`, borderRadius: 14, fontSize: 11, fontWeight: 600, padding: "6px 10px", width: "auto", maxWidth: 190, opacity: dim ? 0.18 : 1,
        boxShadow: selected === n.id ? `0 0 0 4px ${c}55` : `3px 3px 8px ${pal.shadow}` } };
  }), [vis.nodes, positions, focus, selected, pal, COLORS, theme]); // eslint-disable-line react-hooks/exhaustive-deps
  const edges: Edge[] = useMemo(() => vis.edges.map((e) => {
    const lit = selected ? e.source === selected || e.target === selected : hit.edges.has(e.id); const dim = focus && !lit;
    return { id: e.id, source: e.source, target: e.target, label: lit ? e.rel.replace(/_/g, " ").toLowerCase() : undefined, markerEnd: { type: MarkerType.ArrowClosed, color: lit ? pal.purpleDeep : pal.edge },
      style: { stroke: lit ? pal.purpleDeep : pal.edge, strokeWidth: lit ? 2.5 : 1.2, opacity: dim ? 0.1 : 1 }, labelStyle: { fontSize: 10, fill: pal.purpleDeep } };
  }), [vis.edges, selected, hit.edges, focus, pal]);

  const node = all?.nodes.find((n) => n.id === selected);
  const err = g.error ?? gaps.error ?? papers.error;
  if (err) return <ErrorState message={err} onRetry={() => { g.reload(); gaps.reload(); papers.reload(); }} />;
  if (g.loading || gaps.loading || papers.loading) return <><PageHeader title="Knowledge Graph" /><CardSkeleton h="h-96" /></>;
  if (!all?.nodes.length) return <><PageHeader title="Knowledge Graph" /><Card><EmptyState title="No graph yet" text="The graph is built once papers have been analysed." /></Card></>;

  return (
    <div className="space-y-4">
      <PageHeader title="Knowledge Graph" subtitle="Explore how papers, topics, methods and gaps connect. Drag, zoom, click a node for details." />
      <Card className="!p-3"><div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input className="field !pl-9" placeholder="Search nodes or relationships (e.g. uses)…" aria-label="Search graph" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categories">{CATEGORIES.map((c) => {
          const active = on.has(c);
          return <button key={c} aria-pressed={active} onClick={() => { const n = new Set(on); active ? n.delete(c) : n.add(c); setOn(n); }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${active ? "bg-sand-card shadow-raised-sm" : "bg-sand-light text-ink-faint shadow-inset"}`}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[c], opacity: active ? 1 : 0.35 }} />{c}</button>;
        })}</div>
      </div></Card>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="!p-0 overflow-hidden"><div className="h-[62vh] min-h-[420px] bg-sand-light" aria-label="Knowledge graph canvas">
          <ReactFlow key={version} colorMode={theme} nodes={nodes} edges={edges} fitView minZoom={0.2} maxZoom={2.5} nodesConnectable={false} proOptions={{ hideAttribution: true }}
            onNodeClick={(_, n) => setSelected(n.id)} onPaneClick={() => setSelected(null)}>
            <Background color={pal.line} gap={22} /><Controls showInteractive={false} /><MiniMap pannable zoomable maskColor={pal.mask} style={{ background: pal.card }} nodeStrokeWidth={0} nodeColor={(n) => String((n.data as { color?: string }).color ?? pal.forest)} />
          </ReactFlow></div></Card>
        <Card aria-live="polite">
          {!node ? <p className="text-sm text-ink-muted">Select a node to see its details and connections. {vis.nodes.length} nodes · {vis.edges.length} links shown.</p> : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2"><div><Badge tone="sand">{node.category}</Badge><h2 className="mt-1.5 text-base font-bold text-forest-deep">{node.label}</h2></div>
                <Button variant="ghost" className="!p-1.5" aria-label="Clear selection" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button></div>
              {node.detail && <p className="text-sm text-ink-muted">{node.detail}</p>}
              {node.paperId && <Link className="text-sm font-semibold text-purple-deep" to={`/library/${node.paperId}`}>Open paper →</Link>}
              <Button className="w-full" onClick={() => setExpanded(new Set([...expanded, node.id]))}><Maximize2 className="h-4 w-4" />Expand connections</Button>
              <div><h3 className="mb-1 text-xs font-bold uppercase text-ink-muted">Connected to</h3>
                <ul className="max-h-60 space-y-1 overflow-auto text-sm">{neighbours(all.edges, node.id).map((n, i) => { const o = all.nodes.find((x) => x.id === n.id); return o ? (
                  <li key={i}><button className="w-full rounded-lg px-2 py-1 text-left hover:bg-sand-dark/40" onClick={() => { setExpanded(new Set([...expanded, node.id])); setSelected(o.id); }}><span className="text-xs text-ink-muted">{n.dir === "out" ? "→" : "←"} {n.rel.replace(/_/g, " ").toLowerCase()}</span><br />{o.label}</button></li>) : null; })}</ul></div>
            </div>)}
        </Card>
      </div>
    </div>
  );
}
export default function Graph() { return <ReactFlowProvider><Inner /></ReactFlowProvider>; }
