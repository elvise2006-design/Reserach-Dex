import { FlaskConical, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button, Field } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { errMsg } from "@/lib/format";

export default function Auth() {
  const { signIn, enterDemo } = useApp();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try { await signIn(email, pw, signup); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="theme-light relative hidden flex-col justify-between overflow-hidden bg-forest-deep p-12 text-onaccent lg:flex">
        <Logo light />
        <div className="relative z-10 max-w-md">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-forest-soft">Discover · Connect · Understand</p>
          <h1 className="text-4xl font-extrabold leading-tight">Turn individual papers into one interconnected picture of your field.</h1>
          <ul className="mt-8 space-y-4 text-sm text-forest-soft">
            <li><b className="text-purple-soft">Discover</b> — topics, methods and trends across your whole collection.</li>
            <li><b className="text-purple-soft">Connect</b> — an explorable graph of papers, methods, findings and gaps.</li>
            <li><b className="text-purple-soft">Understand</b> — cited answers, candidate contradictions and reports.</li>
          </ul>
        </div>
        <svg className="absolute -bottom-20 -right-20 h-96 w-96 opacity-20" viewBox="0 0 200 200" aria-hidden>
          <g stroke="#DCE9DF" strokeWidth="1.5"><path d="M30 60L100 30L170 70L140 150L60 160Z" fill="none" /><path d="M100 30L140 150M30 60L140 150M60 160L170 70" /></g>
          {[[30, 60], [100, 30], [170, 70], [140, 150], [60, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={i === 1 ? "#8B5CF6" : "#DCE9DF"} />)}
        </svg>
        <p className="text-xs text-forest-soft/80">Answers are grounded in your papers and every claim links to its source.</p>
      </section>
      <section className="grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-2xl font-extrabold text-forest-deep">{signup ? "Create your workspace" : "Welcome back"}</h2>
          <p className="mb-6 mt-1 text-sm text-ink-muted">{signup ? "Start building your research landscape." : "Sign in to continue your research."}</p>
          <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
            <Field label="Email"><input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password" hint={signup ? "At least 8 characters." : undefined}>
              <input className="field" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            {err && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad-ink">{err}</p>}
            <Button variant="primary" className="w-full" type="submit" disabled={busy || !email || pw.length < 8}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{signup ? "Create account" : "Sign in"}
            </Button>
            <button type="button" className="w-full text-center text-sm font-medium text-ink-muted hover:text-forest" onClick={() => { setSignup(!signup); setErr(null); }}>
              {signup ? "Have an account? Sign in" : "New here? Create an account"}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-faint"><span className="h-px flex-1 bg-sand-dark" />or<span className="h-px flex-1 bg-sand-dark" /></div>
          <Button variant="ai" className="w-full" onClick={() => enterDemo()}><FlaskConical className="h-4 w-4" />Explore with sample data (demo mode)</Button>
          <p className="mt-2 text-center text-xs text-ink-muted">Demo mode needs no backend. It uses clearly labelled synthetic papers.</p>
        </div>
      </section>
    </div>
  );
}
