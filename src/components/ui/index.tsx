import { AlertTriangle, CheckCircle2, FileSearch, Info, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { useApp } from "@/context/AppContext";

export function Card({ className, children, ...r }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("card p-5", className)} {...r}>{children}</div>;
}

export function Button({ variant = "secondary", loading, className, children, ...r }:
  { variant?: "primary" | "secondary" | "ai" | "ghost" | "danger"; loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(`btn-${variant}`, className)} disabled={loading || r.disabled} {...r}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{children}
    </button>
  );
}

export function SectionTitle({ icon, title, hint, right }: { icon?: ReactNode; title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold text-forest-deep">{icon}{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-deep sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx("relative overflow-hidden rounded-xl bg-sand-dark/60", className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-sand-light/70 to-transparent" />
    </div>
  );
}
export const CardSkeleton = ({ h = "h-40" }: { h?: string }) => <Card><Skeleton className="mb-3 h-4 w-1/3" /><Skeleton className={cx("w-full", h)} /></Card>;

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 px-6 py-10 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-sand-light text-forest shadow-inset">{icon ?? <FileSearch className="h-6 w-6" />}</div>
      <h3 className="text-base font-bold text-forest-deep">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl bg-bad/10 p-4 text-sm text-ink">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
      <div className="flex-1"><p className="font-semibold">Couldn't load this</p><p className="text-ink-muted">{message}</p></div>
      {onRetry && <Button variant="secondary" onClick={onRetry} className="!py-1.5">Retry</Button>}
    </div>
  );
}

export function Badge({ tone = "forest", children, className }: { tone?: "forest" | "ai" | "warn" | "ok" | "bad" | "sand"; children: ReactNode; className?: string }) {
  const t = { forest: "bg-forest-soft text-forest-deep", ai: "bg-purple-soft text-purple-deep", warn: "bg-warn/20 text-warn-ink",
    ok: "bg-ok/15 text-ok-ink", bad: "bg-bad/15 text-bad-ink", sand: "bg-sand-dark/70 text-ink" }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", t, className)}>{children}</span>;
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange(v: T): void; options: { value: T; label: ReactNode; aria: string }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-sand-light p-1 shadow-inset">
      {options.map((o) => (
        <button key={o.value} aria-label={o.aria} aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={cx("rounded-lg px-3 py-1.5 text-sm font-medium transition duration-200",
            value === o.value ? "bg-sand-card text-forest-deep shadow-raised-sm" : "text-ink-muted hover:text-ink")}>{o.label}</button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = "forest" }: { value: number; tone?: "forest" | "ai" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-sand-light shadow-inset" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all duration-500", tone === "ai" ? "bg-purple" : "bg-forest")} style={{ width: `${Math.max(3, value * 100)}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose(): void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-forest-deep/40 dark:bg-black/60 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-md p-6" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold text-forest-deep">{title}</h3>
              <button aria-label="Close" onClick={onClose} className="btn-ghost !p-1.5"><X className="h-4 w-4" /></button></div>
            <div className="text-sm text-ink">{children}</div>
            {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, title, text, confirmLabel = "Delete", onConfirm, onClose, busy }: { open: boolean; title: string; text: string; confirmLabel?: string; onConfirm(): void; onClose(): void; busy?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" className="!bg-bad hover:!bg-[#c25959]" onClick={onConfirm} loading={busy}>{confirmLabel}</Button></>}>
      <p className="text-ink-muted">{text}</p>
    </Modal>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useApp();
  const icon = { success: <CheckCircle2 className="h-4 w-4 text-ok" />, error: <AlertTriangle className="h-4 w-4 text-bad" />, info: <Info className="h-4 w-4 text-purple-deep" /> };
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2 md:bottom-6" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }}
            className="card pointer-events-auto flex items-start gap-2.5 px-4 py-3 text-sm" role={t.kind === "error" ? "alert" : "status"}>
            <span className="mt-0.5">{icon[t.kind]}</span><span className="flex-1">{t.text}</span>
            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-ink-faint hover:text-ink"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function DemoBanner() {
  const { mode } = useApp();
  if (mode !== "demo") return null;
  return (
    <div className="flex items-center gap-2 bg-warn/20 px-4 py-2 text-xs font-medium text-warn-ink" role="note">
      <Info className="h-4 w-4 shrink-0" />
      <span><b>DEMO MODE</b> — sample data: 8 invented papers analysed by the real pipeline with a scripted test model. Not real research findings. Uploads are simulated.</span>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="label mb-1.5 block">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}</label>;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange(v: boolean): void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div><p className="text-sm font-medium">{label}</p>{hint && <p className="text-xs text-ink-muted">{hint}</p>}</div>
      <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={cx("relative h-7 w-12 shrink-0 rounded-full shadow-inset transition", checked ? "bg-forest" : "bg-sand-dark")}>
        <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-sand-card shadow-raised-sm transition-all duration-200", checked ? "left-6" : "left-1")} />
      </button>
    </div>
  );
}
