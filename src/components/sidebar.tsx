"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  CheckSquare,
  Sparkles,
  Map,
  MessageSquareCode,
  FileSignature,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  Compass,
  Briefcase,
  FileText,
  History
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Resume", href: "/upload", icon: UploadCloud },
    { name: "Resume Analysis", href: "/analysis", icon: FileSearch },
    { name: "Resume Progress", href: "/progress", icon: History },
    { name: "Skills Profile", href: "/skills", icon: CheckSquare },
    { name: "Job Match", href: "/job-match", icon: Briefcase },
    { name: "Project Hub", href: "/projects", icon: Sparkles },
    { name: "Career Roadmap", href: "/roadmap", icon: Map },
    { name: "Career Report", href: "/career-report", icon: FileText },
    { name: "Ask Pilo", href: "/chat", icon: MessageSquareCode },
    { name: "Resume Builder", href: "/builder", icon: FileSignature },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <motion.div
      animate={{ width: isCollapsed ? 76 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 z-30 h-screen bg-white border-r border-border flex flex-col justify-between select-none"
    >
      {/* Top Section: Logo & Toggle */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/60">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft flex-shrink-0 animate-soft-pulse">
              <Compass className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="font-bold text-lg text-slate-800 tracking-tight whitespace-nowrap"
              >
                ResumePilot<span className="text-primary">.ai</span>
              </motion.span>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors hidden md:block"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="block">
                <div
                  className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                    isActive
                      ? "text-primary bg-accent"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {/* Selected Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/4 w-1 h-1/2 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />

                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {item.name}
                    </motion.span>
                  )}

                  {/* Tooltip on collapse */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-40 shadow-md">
                      {item.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Log Out & Mascot Guide shortcut */}
      <div className="p-3 border-t border-border/60">
        <button
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="w-full text-left block"
        >
          <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/50 transition-colors group cursor-pointer">
            <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:text-red-500" />
            {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-40 shadow-md">
                Sign Out
              </div>
            )}
          </div>
        </button>
      </div>
    </motion.div>
  );
};
