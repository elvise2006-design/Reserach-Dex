import { BarChart3, Bot, Compass, FileText, Home, Library, Network, Settings } from "lucide-react";

export const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/library", label: "Research Library", icon: Library },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/graph", label: "Knowledge Graph", icon: Network },
  { to: "/ai", label: "AI Researcher", icon: Bot, ai: true },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
export const MOBILE_NAV = [NAV[0], NAV[1], NAV[3], NAV[4]] as const;
export { BarChart3 };
