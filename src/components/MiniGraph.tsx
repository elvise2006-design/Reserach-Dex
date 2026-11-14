import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Paper, Topic } from "@/api/types";
import { truncate } from "@/lib/format";
import { usePalette } from "@/lib/theme";

/** Small static radial overview of topics and their most common methods; click opens the full graph. */
export function MiniGraph({ topics, papers, name }: { topics: Topic[]; papers: Paper[]; name: string }) {
  const nav = useNavigate(); const c = usePalette();
  const layout = useMemo(() => {
    const ts = topics.slice(0, 6); const nodes: { x: number; y: number; label: string; kind: "t" | "m" }[] = []; const links: [number, number, number, number][] = [];
    ts.forEach((t, i) => {
      const a = (i / ts.length) * Math.PI * 2 - Math.PI / 2; const tx = 200 + Math.cos(a) * 95, ty = 130 + Math.sin(a) * 85;
      nodes.push({ x: tx, y: ty, label: t.label.split(",")[0], kind: "t" }); links.push([200, 130, tx, ty]);
      const counts = new Map<string, number>();
      papers.filter((p) => t.paper_ids.includes(p.id)).forEach((p) => p.methods.forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1)));
      [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2).forEach(([m], k) => {
        const b = a + (k ? 0.45 : -0.45); const mx = 200 + Math.cos(b) * 170, my = 130 + Math.sin(b) * 118;
        nodes.push({ x: mx, y: my, label: m, kind: "m" }); links.push([tx, ty, mx, my]);
      });
    });
    return { nodes, links };
  }, [topics, papers]);
  return (
    <button onClick={() => nav("/graph")} className="block w-full rounded-xl bg-sand-light shadow-inset transition hover:shadow-pressed" aria-label="Open the full knowledge graph">
      <svg viewBox="0 0 400 260" className="h-auto w-full" role="img" aria-label="Overview of research topics and methods">
        {layout.links.map((l, i) => <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={c.forest} strokeOpacity=".35" strokeWidth="1.5" />)}
        <circle cx="200" cy="130" r="26" fill={c.forestDeep} /><text x="200" y="134" textAnchor="middle" fontSize="7" fill="#F3EDE1" fontWeight="700">{truncate(name, 9)}</text>
        {layout.nodes.map((n, i) => (
          <g key={i}><circle cx={n.x} cy={n.y} r={n.kind === "t" ? 15 : 9} fill={n.kind === "t" ? c.forest : c.purple} />
            <text x={n.x} y={n.y + (n.kind === "t" ? 28 : 21)} textAnchor="middle" fontSize="8.5" fill={c.ink} fontWeight="600">{truncate(n.label, 18)}</text></g>))}
      </svg>
    </button>
  );
}
