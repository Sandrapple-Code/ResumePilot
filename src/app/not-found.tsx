"use client";

import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Pilo } from "@/components/pilo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl p-8 shadow-premium space-y-6">
        
        {/* Mascot */}
        <div className="flex justify-center">
          <Pilo
            state="confused"
            bubbleText="404 - Lost off the flight path! I couldn't find this page."
            bubblePosition="top"
            size={100}
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            The coordinates you entered don&apos;t match any of our career navigation pages. Let&apos;s redirect you back to safety.
          </p>
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="w-full h-11 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
