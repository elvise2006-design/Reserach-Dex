import { useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
export type Theme = "light" | "dark";

const media = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null);

export function resolveTheme(pref: ThemePref): Theme {
  return pref === "system" ? (media()?.matches ? "dark" : "light") : pref;
}

/** Toggle `html.dark` and the browser chrome colour. `animate` cross-fades colours briefly. */
export function applyTheme(pref: ThemePref, animate = false) {
  const r = document.documentElement; const dark = resolveTheme(pref) === "dark";
  if (dark === r.classList.contains("dark")) return;
  if (animate && !r.classList.contains("reduce-motion")) {
    r.classList.add("theme-anim");
    window.setTimeout(() => r.classList.remove("theme-anim"), 350);
  }
  r.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#161B18" : "#EAE3D3");
}

/** Re-apply when the OS switches light/dark while the pref is "system". */
export function watchSystemTheme(pref: ThemePref) {
  const m = media(); if (pref !== "system" || !m) return () => {};
  const on = () => applyTheme("system", true);
  m.addEventListener("change", on);
  return () => m.removeEventListener("change", on);
}

/** The theme actually on screen (follows `html.dark`), for canvas/SVG code that needs literal colours. */
export function useTheme(): Theme {
  const get = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [t, setT] = useState<Theme>(get);
  useEffect(() => {
    const o = new MutationObserver(() => setT(get()));
    o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => o.disconnect();
  }, []);
  return t;
}

/** Literal colours for Recharts / React Flow / inline SVG (mirror the CSS tokens). */
export const COLORS = {
  light: {
    forestDeep: "#173F35", forest: "#245C49", forestSoft: "#DCE9DF", purple: "#8B5CF6", purpleDeep: "#7041D9",
    card: "#F5F0E6", surface: "#F3EDE1", line: "#D8CEBC", ink: "#24332D", muted: "#5B675F", faint: "#778078", edge: "#9CA89F",
    ok: "#399B70", warn: "#D49A45", bad: "#D96B6B", mint: "#9CC5B0", lilac: "#C9B8F5", onaccent: "#F3EDE1",
    shadow: "rgba(150,134,104,.35)", hover: "rgba(36,92,73,.06)", mask: "rgba(234,227,211,.6)",
  },
  dark: {
    forestDeep: "#2F7A5B", forest: "#5BB48A", forestSoft: "#1D3A2E", purple: "#A78BFA", purpleDeep: "#B9A3FF",
    card: "#1E2521", surface: "#111512", line: "#313B35", ink: "#E6E3D9", muted: "#A7B0A8", faint: "#7E8981", edge: "#56625B",
    ok: "#4FBF8A", warn: "#E0AE5C", bad: "#E98282", mint: "#8FCDB0", lilac: "#7D69C9", onaccent: "#0E1512",
    shadow: "rgba(0,0,0,.5)", hover: "rgba(167,215,189,.07)", mask: "rgba(17,21,18,.65)",
  },
} as const;
export type Palette = { [K in keyof (typeof COLORS)["light"]]: string };

export function usePalette(): Palette { return COLORS[useTheme()]; }
