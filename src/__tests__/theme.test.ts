import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, resolveTheme, watchSystemTheme } from "@/lib/theme";
import { DEFAULT_PREFS, loadPrefs } from "@/lib/prefs";

function mockSystem(dark: boolean) {
  const listeners = new Set<() => void>();
  const m = { matches: dark, addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) };
  vi.stubGlobal("matchMedia", () => m);
  return { set(v: boolean) { m.matches = v; listeners.forEach((f) => f()); }, listeners };
}

afterEach(() => { vi.unstubAllGlobals(); document.documentElement.className = ""; localStorage.clear(); });

describe("theme", () => {
  it("defaults to following the system", () => {
    expect(DEFAULT_PREFS.theme).toBe("system");
    expect(loadPrefs().theme).toBe("system");
  });

  it("resolves explicit and system preferences", () => {
    mockSystem(true);
    expect(resolveTheme("system")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
    mockSystem(false);
    expect(resolveTheme("system")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("toggles html.dark", () => {
    mockSystem(false);
    applyTheme("dark");
    expect(document.documentElement).toHaveClass("dark");
    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("follows OS changes only while set to system", () => {
    const sys = mockSystem(false);
    applyTheme("system");
    const stop = watchSystemTheme("system");
    sys.set(true);
    expect(document.documentElement).toHaveClass("dark");
    stop();
    expect(sys.listeners.size).toBe(0);
    expect(watchSystemTheme("light")).toBeTypeOf("function");
    expect(sys.listeners.size).toBe(0);
  });
});
