/** ResearchDex design tokens. Palette comes straight from the brief.
 * Values live in CSS variables (src/styles/index.css) so `html.dark` can swap them. */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // <Button variant> builds `btn-${variant}` at runtime, so the scanner never sees these names.
  safelist: ["btn-primary", "btn-secondary", "btn-ai", "btn-ghost", "btn-danger"],
  theme: {
    extend: {
      colors: {
        forest: { deep: c("forest-deep"), DEFAULT: c("forest"), soft: c("forest-soft") },
        sand: { DEFAULT: c("sand"), light: c("sand-light"), card: c("sand-card"), dark: c("sand-dark") },
        purple: { DEFAULT: c("purple"), deep: c("purple-deep"), soft: c("purple-soft") },
        ink: { DEFAULT: c("ink"), muted: c("ink-muted"), faint: c("ink-faint") },
        ok: { DEFAULT: c("ok"), ink: c("ok-ink") }, warn: { DEFAULT: c("warn"), ink: c("warn-ink") }, bad: { DEFAULT: c("bad"), ink: c("bad-ink") },
        onaccent: c("onaccent"),
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        raised: "var(--sh-raised)",
        "raised-sm": "var(--sh-raised-sm)",
        inset: "var(--sh-inset)",
        pressed: "var(--sh-pressed)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pop: { "0%": { opacity: 0, transform: "translateY(6px) scale(.98)" }, "100%": { opacity: 1, transform: "none" } },
      },
      animation: { pop: "pop .25s ease-out both" },
    },
  },
  plugins: [],
};
