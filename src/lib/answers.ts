import type { Answer, Citation } from "@/api/types";

const TAG = /\[([^\[\]:\s]+):([^\[\]:\s]+):(\d+)\]/g;

export interface Finding { n: number; text: string; refs: number[] }

/** Split an answer into numbered findings; each carries the 1-based indexes of the citations it uses. */
export function toFindings(a: Pick<Answer, "answer" | "citations">): Finding[] {
  const idx = new Map<string, number>(a.citations.map((c, i) => [c.tag, i + 1]));
  const out: Finding[] = [];
  const re = /(?<=[.!?])((?:\s*\[[^\[\]]+\])*)(\s+|$)/g;
  let prev = 0; const parts: string[] = [];
  for (const m of a.answer.matchAll(re)) {
    parts.push(a.answer.slice(prev, m.index! + m[1].length).trim());
    prev = m.index! + m[0].length;
  }
  const tail = a.answer.slice(prev).trim();
  if (tail) parts.push(tail);
  for (const s of parts.filter(Boolean)) {
    const refs: number[] = [];
    for (const m of s.matchAll(TAG)) {
      const i = idx.get(`${m[1]}:${m[2]}:${m[3]}`);
      if (i && !refs.includes(i)) refs.push(i);
    }
    out.push({ n: out.length + 1, text: s.replace(TAG, "").replace(/\s+([.,;])/g, "$1").trim(), refs });
  }
  return out;
}

/** Report markdown: turn raw [paper:section:page] tags into compact inline code chips. */
export function chipifyTags(md: string): string {
  return md.replace(TAG, (_m, p, s, n) => `\`${String(p).slice(0, 6)}·${s}·p${n}\``);
}

export function relatedQuestions(citations: Citation[]): string[] {
  const titles = [...new Set(citations.map((c) => c.paper_title))].slice(0, 2);
  const out = titles.map((t) => `What are the limitations reported in "${t}"?`);
  if (titles.length) out.push("Which other papers in this collection use similar methods?");
  return out;
}
