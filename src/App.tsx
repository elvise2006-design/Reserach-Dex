import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";

const Library = lazy(() => import("@/pages/Library"));
const PaperDetail = lazy(() => import("@/pages/PaperDetail"));
const Discover = lazy(() => import("@/pages/Discover"));
const Graph = lazy(() => import("@/pages/Graph"));
const Researcher = lazy(() => import("@/pages/Researcher"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));

const Fallback = () => <div className="space-y-4 p-2"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-64 w-full" /></div>;

export default function App() {
  const { user, booting } = useApp();
  if (booting) return <div className="grid min-h-screen place-items-center"><Skeleton className="h-24 w-24 rounded-3xl" /></div>;
  if (!user) return <Auth />;
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="library/:paperId" element={<PaperDetail />} />
          <Route path="discover" element={<Discover />} />
          <Route path="graph" element={<Graph />} />
          <Route path="ai" element={<Researcher />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
