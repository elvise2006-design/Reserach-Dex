import { useEffect, useRef, useState } from "react";
import { applyTheme, watchSystemTheme, type ThemePref } from "./theme";

export interface Prefs {
  theme: ThemePref;
  density: "comfortable" | "compact"; reduceMotion: boolean; largeText: boolean; neumorphism: number;
  showQuotes: boolean; showSuggestions: boolean; answerDetail: "concise" | "detailed";
  notifyJobs: boolean; notifyReports: boolean; notifyErrors: boolean; sidebarCollapsed: boolean;
}
export const DEFAULT_PREFS: Prefs = {
  theme: "system",
  density: "comfortable", reduceMotion: false, largeText: false, neumorphism: 1, showQuotes: true,
  showSuggestions: true, answerDetail: "detailed", notifyJobs: true, notifyReports: true, notifyErrors: true,
  sidebarCollapsed: false,
};
const KEY = "rdx_prefs";

export function loadPrefs(): Prefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEFAULT_PREFS; }
}
export function applyPrefs(p: Prefs, animate = false) {
  const r = document.documentElement;
  applyTheme(p.theme, animate);
  r.classList.toggle("density-compact", p.density === "compact");
  r.classList.toggle("reduce-motion", p.reduceMotion);
  r.classList.toggle("text-large", p.largeText);
  r.style.setProperty("--neu", String(p.neumorphism));
}
export function usePrefsState() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const first = useRef(true);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
    applyPrefs(prefs, !first.current); first.current = false;
  }, [prefs]);
  useEffect(() => watchSystemTheme(prefs.theme), [prefs.theme]);
  return [prefs, (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }))] as const;
}
