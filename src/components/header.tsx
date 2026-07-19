"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Search, ChevronDown, User, Sparkles, BookOpen, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Dynamic Page Title
  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    if (!path) return "Overview";
    
    // Map pathnames to beautiful titles
    const titleMap: Record<string, string> = {
      dashboard: "Dashboard Overview",
      upload: "Upload Your Resume",
      analysis: "AI Resume Analysis",
      skills: "Skills Profile & Gaps",
      projects: "Tailored Project Hub",
      roadmap: "Career Timeline Roadmap",
      chat: "Ask Pilo AI Assistant",
      builder: "Smart Resume Builder",
      settings: "Account Settings",
    };

    return titleMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  const mockNotifications = [
    { id: 1, title: "Resume Scored!", desc: "Pilo scored your resume at 78/100. Check suggestions.", time: "2m ago" },
    { id: 2, title: "New Project Match!", desc: "Build a 'FastAPI Web Service' to fill your Python skill gap.", time: "1h ago" },
    { id: 3, title: "Career Path Updated!", desc: "Added Senior Frontend Engineer milestones.", time: "1d ago" },
  ];

  return (
    <header className="h-16 border-b border-border/60 bg-white/80 backdrop-blur-md fixed top-0 right-0 left-0 z-20 pl-[76px] md:pl-[260px] flex items-center justify-between px-6 select-none">
      {/* Left: Dynamic Page Title */}
      <div>
        <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight transition-all">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search Bar (Desktop) */}
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search analysis, projects, templates..."
            className="w-64 h-9 pl-9 pr-4 rounded-xl border border-border bg-slate-50/50 text-xs text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Quick Helper Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/80 rounded-xl text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Pilo Active</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-border shadow-premium overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">Notifications</h3>
                  <button className="text-[10px] text-primary font-bold hover:underline">Mark all read</button>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-xs font-bold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl border border-border hover:bg-slate-50 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-soft overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.name
                  ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : profile?.email ? profile.email.slice(0, 2).toUpperCase() : "U"
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 hidden sm:block">
              {profile?.name || profile?.email?.split("@")[0] || "Pilot"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
 
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2.5 w-48 bg-white rounded-2xl border border-border shadow-premium overflow-hidden z-50 p-1.5"
              >
                <div className="px-3 py-2 border-b border-border/60 mb-1">
                  <p className="text-xs font-bold text-slate-800">
                    {profile?.name || profile?.email?.split("@")[0] || "Pilot User"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium overflow-hidden text-ellipsis">
                    {profile?.email || "guest@resumepilot.ai"}
                  </p>
                </div>
                <Link href="/settings" className="block">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </div>
                </Link>
                <Link href="/roadmap" className="block">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>My Roadmap</span>
                  </div>
                </Link>
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    router.push("/login");
                  }}
                  className="w-full text-left block"
                >
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-650 hover:text-red-750 hover:bg-red-50 cursor-pointer">
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
