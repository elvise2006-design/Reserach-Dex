import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { DemoBanner, Toaster } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { cx } from "@/lib/format";
import { MOBILE_NAV } from "./nav";
import { Sidebar, SidebarBody } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  const { prefs } = useApp();
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  useEffect(() => setDrawer(false), [loc.pathname]);
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-sand-card focus:px-3 focus:py-2">Skip to content</a>
      <Sidebar />
      <div className={cx("transition-[padding] duration-300", prefs.sidebarCollapsed ? "md:pl-[84px]" : "md:pl-64")}>
        <DemoBanner />
        <TopBar onMenu={() => setDrawer(true)} />
        <main id="main" className="px-4 pb-28 pt-2 md:px-8 md:pb-12"><Outlet /></main>
      </div>
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-forest-deep/40 dark:bg-black/60" onClick={() => setDrawer(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-72 max-w-[86vw] bg-sand shadow-raised" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ duration: 0.25 }}>
              <button aria-label="Close navigation" className="btn-ghost absolute right-2 top-3 !p-2" onClick={() => setDrawer(false)}><X className="h-4 w-4" /></button>
              <SidebarBody onNavigate={() => setDrawer(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <nav aria-label="Primary" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-2xl bg-sand-card p-1.5 shadow-raised md:hidden">
        {MOBILE_NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={"end" in n ? n.end : false}
            className={({ isActive }) => cx("flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold", isActive ? "bg-sand text-forest-deep shadow-inset" : "text-ink-muted")}>
            <n.icon className="h-5 w-5" aria-hidden />{n.label.replace("Research ", "").replace("Knowledge ", "")}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold text-ink-muted"><MoreHorizontal className="h-5 w-5" />More</button>
      </nav>
      <Toaster />
    </div>
  );
}
