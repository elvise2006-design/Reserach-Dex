import { Activity, ChevronsLeft, ChevronsRight, HardDrive } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useResource } from "@/hooks/useResource";
import { bytes, cx } from "@/lib/format";
import { Logo } from "@/components/ui/Logo";
import { NAV } from "./nav";

export function SidebarBody({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { api, user, mode } = useApp();
  const stats = useResource(() => api.system.stats());
  const health = useResource(() => api.system.health());
  const used = stats.data?.storage_bytes ?? 0;
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className={cx("px-1 pt-1", collapsed && "grid place-items-center")}><Logo compact={collapsed} /></div>
      <nav aria-label="Main" className="flex-1 space-y-1.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={"end" in n ? n.end : false} onClick={onNavigate} title={collapsed ? n.label : undefined}
            className={({ isActive }) => cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200",
              collapsed && "justify-center",
              isActive ? "bg-sand-card text-forest-deep shadow-raised-sm" : "text-ink-muted hover:bg-sand-dark/40 hover:text-ink")}>
            {({ isActive }) => (<>
              <n.icon className={cx("h-[18px] w-[18px] shrink-0", isActive && ("ai" in n && n.ai ? "text-purple-deep" : "text-forest"))} aria-hidden />
              {!collapsed && <span>{n.label}</span>}
              {!collapsed && "ai" in n && n.ai && <span className="ml-auto rounded-full bg-purple-soft px-1.5 py-0.5 text-[10px] font-bold text-purple-deep">AI</span>}
            </>)}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="space-y-3">
          <div className="card-flat p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink-muted"><HardDrive className="h-3.5 w-3.5" />Storage</div>
            <p className="text-sm font-semibold">{mode === "demo" ? "Demo — no files stored" : bytes(used)}</p>
            <p className="text-xs text-ink-muted">{stats.data ? `${stats.data.papers} papers · ${stats.data.extracted} analysed` : "…"}</p>
          </div>
          <div className="card-flat flex items-center gap-2 p-3 text-xs" role="status">
            <Activity className={cx("h-3.5 w-3.5", health.data?.ok ? "text-ok" : "text-bad")} />
            <span className="font-medium">{health.loading ? "Checking…" : health.data?.detail}</span>
          </div>
        </div>
      )}
      <div className={cx("flex items-center gap-3 rounded-xl p-2", collapsed && "justify-center")}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-onaccent">{user?.email[0]?.toUpperCase()}</div>
        {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.email}</p><p className="text-xs text-ink-muted">{mode === "demo" ? "Demo session" : "Researcher"}</p></div>}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { prefs, setPrefs } = useApp();
  const collapsed = prefs.sidebarCollapsed;
  return (
    <aside className={cx("fixed inset-y-0 left-0 z-30 hidden bg-sand shadow-[6px_0_16px_-8px_var(--sh-dark)] transition-[width] duration-300 md:block", collapsed ? "w-[84px]" : "w-64")}>
      <SidebarBody collapsed={collapsed} />
      <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setPrefs({ sidebarCollapsed: !collapsed })}
        className="absolute -right-3 top-8 grid h-6 w-6 place-items-center rounded-full bg-sand-card text-ink-muted shadow-raised-sm hover:text-forest">
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
