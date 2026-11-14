export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const u = ["KB", "MB", "GB"]; let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${u[i]}`;
}
export function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
export function relTime(iso?: string | null, now = Date.now()): string {
  if (!iso) return "";
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
export const pct = (x: number | null | undefined) => (x == null ? "n/a" : `${x >= 0 ? "+" : ""}${Math.round(x * 100)}%`);
export const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
export function errMsg(e: unknown): string { return e instanceof Error ? e.message : "Something went wrong"; }
