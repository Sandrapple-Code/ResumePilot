"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, User, Lock, ArrowRight } from "lucide-react";
import { Pilo } from "@/components/pilo";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, registerWithEmail } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // 1. Username length validation
    if (!username.trim()) {
      setErrorMsg("Please enter a valid username.");
      setLoading(false);
      return;
    }

    // 2. Password strength validation
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await registerWithEmail(username.trim(), password);
      } else {
        await loginWithEmail(username.trim(), password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Authentication failed:", err);
      setErrorMsg(err.message || "Authentication failed. Please verify your details.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6 relative overflow-hidden font-sans select-none text-slate-800">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-accent rounded-full filter blur-[80px] opacity-60 -ml-20 -mt-20" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50 rounded-full filter blur-[100px] opacity-50 -mr-20 -mb-20" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft animate-soft-pulse">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">
              ResumePilot<span className="text-primary">.ai</span>
            </span>
          </Link>
          <p className="text-xs font-semibold text-slate-400">Agentic AI Resume Intelligence Platform</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-premium"
        >
          {/* Welcoming Pilo Bear Mascot */}
          <div className="flex flex-col items-center mb-6">
            <Pilo
              state={errorMsg ? "confused" : (loading ? "thinking" : "happy")}
              bubbleText={
                errorMsg 
                  ? errorMsg 
                  : isRegister 
                  ? "Welcome, new pilot! Let's get your profile set up."
                  : "Welcome back, pilot! Let's get your career airborne."
              }
              bubblePosition="top"
              size={85}
              className="mb-2"
            />
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200/80 bg-slate-50/30 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200/80 bg-slate-50/30 text-sm text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary-hover disabled:bg-primary/70 text-white font-bold rounded-xl shadow-soft flex items-center justify-center gap-2 transition-all mt-6 text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-1.5">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>{isRegister ? "Register & Set Up" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register for Free"}
          </button>
        </div>
      </div>
    </div>
  );
}
