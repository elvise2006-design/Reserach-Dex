export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#245C49" />
        <path d="M20 22L44 20M20 22L32 46M44 20L32 46" stroke="#F3EDE1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="22" r="5" fill="#F3EDE1" /><circle cx="44" cy="20" r="5" fill="#F3EDE1" /><circle cx="32" cy="46" r="6" fill="#8B5CF6" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <p className={`font-heading text-lg font-extrabold ${light ? "text-onaccent" : "text-forest-deep"}`}>ResearchDex</p>
          <p className={`text-[10px] font-medium uppercase tracking-[0.16em] ${light ? "text-forest-soft" : "text-ink-muted"}`}>Discover · Connect · Understand</p>
        </div>
      )}
    </div>
  );
}
