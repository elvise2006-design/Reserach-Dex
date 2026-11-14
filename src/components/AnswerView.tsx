import { ShieldCheck } from "lucide-react";
import type { Answer } from "@/api/types";
import { toFindings } from "@/lib/answers";
import { Badge } from "@/components/ui";

export function AnswerView({ answer, onCite, activeCite }: { answer: Answer; onCite?(n: number): void; activeCite?: number | null }) {
  const findings = toFindings(answer);
  const insufficient = answer.answer.startsWith("Insufficient evidence") || answer.answer.startsWith("Demo mode");
  return (
    <div>
      {insufficient ? <p className="text-sm text-ink">{answer.answer}</p> : (
        <ol className="space-y-2.5">
          {findings.map((f) => (
            <li key={f.n} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-soft text-[11px] font-bold text-forest-deep">{f.n}</span>
              <span>{f.text}{" "}
                {f.refs.map((r) => (
                  <button key={r} onClick={() => onCite?.(r)} aria-label={`Source ${r}`}
                    className={`mx-0.5 inline-grid h-5 min-w-5 place-items-center rounded-md px-1 text-[11px] font-bold transition ${activeCite === r ? "bg-purple-deep text-onaccent" : "bg-purple-soft text-purple-deep hover:bg-purple/30"}`}>{r}</button>
                ))}
              </span>
            </li>
          ))}
        </ol>
      )}
      {!insufficient && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={answer.grounded_ratio >= 0.99 ? "ok" : "warn"}><ShieldCheck className="h-3 w-3" />{Math.round(answer.grounded_ratio * 100)}% of sentences verified against sources</Badge>
          <span className="text-xs text-ink-muted">{answer.citations.length} source{answer.citations.length === 1 ? "" : "s"}</span>
        </div>
      )}
    </div>
  );
}
