"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Map,
  MessageSquareCode,
  FileSignature,
  FileSearch,
  CheckCircle2,
  Users
} from "lucide-react";
import { Pilo } from "@/components/pilo";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  const features = [
    {
      title: "Agentic ATS Analysis",
      desc: "Deep scanner agents audit your resume formatting, keywords, and density to secure past strict HR filters.",
      icon: FileSearch,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Skill Gap Analyzer",
      desc: "Compare your resume against live market jobs to discover missing core and auxiliary competencies.",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Tailored Project Hub",
      desc: "Receive curated project recommendations designed explicitly to bridge your skill deficits.",
      icon: Sparkles,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100"
    },
    {
      title: "Milestone Career Roadmap",
      desc: "A personalized step-by-step career navigation tracker from where you are to your dream engineering role.",
      icon: Map,
      color: "bg-amber-50 text-amber-600 border-amber-100"
    },
    {
      title: "24/7 Co-Pilot Chat",
      desc: "Chat directly with Pilo, your bear buddy career coach, to polish summaries or prep for interviews.",
      icon: MessageSquareCode,
      color: "bg-rose-50 text-rose-600 border-rose-100"
    },
    {
      title: "Interactive Builder",
      desc: "Craft clean, LaTeX-grade resumes with real-time scoring and instant feedback as you type.",
      icon: FileSignature,
      color: "bg-purple-50 text-purple-600 border-purple-100"
    }
  ];

  const steps = [
    { num: "01", name: "Drop Your Resume", desc: "Upload your existing resume in PDF or Word format in seconds." },
    { num: "02", name: "Agent Consultation", desc: "Our specialized AI agents break down structural gaps and ATS keywords." },
    { num: "03", name: "Up-Skill with Projects", desc: "Build tailored projects guided by Pilo to bridge missing knowledge." },
    { num: "04", name: "Deploy & Land", desc: "Generate a polished, recruiter-ready resume and take flight." }
  ];

  const agents = [
    { role: "ATS Scanner Agent", status: "Parsing keywords...", icon: FileSearch, delay: 0 },
    { role: "Skills Auditor Agent", status: "Mapping requirements...", icon: ShieldCheck, delay: 1.5 },
    { role: "Project Matching Agent", status: "Generating repos...", icon: Sparkles, delay: 3 },
    { role: "Formatting Agent", status: "Beautifying layout...", icon: FileSignature, delay: 4.5 }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/50 z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-soft animate-soft-pulse">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">
            ResumePilot<span className="text-primary">.ai</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#workflow" className="hover:text-slate-900 transition-colors">How It Works</a>
          <a href="#agents" className="hover:text-slate-900 transition-colors">AI Agents</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link href="/dashboard" className="text-sm font-bold text-white bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-xl shadow-soft transition-colors flex items-center gap-1.5 group">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-7 space-y-6 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent rounded-full text-primary text-xs font-bold shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Introducing ResumePilot AI v1.0</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Navigate Your Career with <span className="text-primary relative inline-block">AI Intelligence</span>
          </h1>

          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Upload your resume, audit ATS keywords with dedicated AI agents, bridge gaps with tailor-made projects, and steer toward your dream job with Pilo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto text-center font-bold text-white bg-primary hover:bg-primary-hover px-8 py-3.5 rounded-xl shadow-premium transition-all flex items-center justify-center gap-2 group">
              <span>Start Analyzing Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto text-center font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 px-8 py-3.5 rounded-xl shadow-soft transition-colors">
              Explore Features
            </a>
          </div>

          {/* Quick Stats */}
          <div className="pt-6 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-2xl font-bold text-slate-900">85%</p>
              <p className="text-xs text-slate-500 font-semibold">ATS Success Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">4.9/5</p>
              <p className="text-xs text-slate-500 font-semibold">User Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">12k+</p>
              <p className="text-xs text-slate-500 font-semibold">Pilots Guided</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Interactive Mascot Hero Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex justify-center"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/60 p-6 shadow-premium relative">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-slate-400">ANALYSIS RADAR</span>
              <span className="px-2 py-1 bg-emerald-550 bg-emerald-50 rounded-lg text-emerald-600 text-[10px] font-bold">LIVE SCORE</span>
            </div>

            {/* Resume Checklist Simulation */}
            <div className="space-y-3.5 mb-8">
              <div className="flex items-center gap-3 p-3 bg-slate-55 bg-slate-50/50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Keywords Matching</p>
                  <p className="text-[10px] text-slate-500">React, TypeScript, Next.js matching</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Experience Structure</p>
                  <p className="text-[10px] text-slate-500">Reverse chronological verified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center text-primary text-[10px] font-bold">!</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Missing Competence</p>
                  <p className="text-[10px] text-rose-500 font-semibold">Docker & CI/CD deployment gaps</p>
                </div>
              </div>
            </div>

            {/* Floating Pilo Guide Mascot */}
            <div className="absolute -bottom-8 -right-4 bg-transparent">
              <Pilo
                state="welcoming"
                bubbleText="Welcome! I'm Pilo. Ready to audit your resume?"
                bubblePosition="left"
                size={110}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Premium Features Tailored for Tech Seekers
            </h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              ResumePilot isn't just an ATS parser. It is a full career accelerator suite powered by cooperating AI agent specialists.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feat) => (
              <motion.div
                key={feat.title}
                variants={itemVariants}
                className="bg-[#FAFAF8]/40 border border-slate-200/60 rounded-3xl p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-5 ${feat.color}`}>
                  <feat.icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How ResumePilot Works */}
      <section id="workflow" className="py-20 max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How ResumePilot Works
          </h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Our step-by-step career improvement pipeline gets your applications ready for recruiters in four stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={step.num} className="relative p-5 bg-white border border-slate-200/50 rounded-2xl shadow-soft">
              <span className="absolute -top-6 left-6 text-4xl font-extrabold text-indigo-100">{step.num}</span>
              <h3 className="text-sm font-bold text-slate-800 mt-2 mb-1.5">{step.name}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              {idx < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 -translate-y-1/2 z-10 text-indigo-200">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI Agent Workflow Section */}
      <section id="agents" className="py-20 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-indigo-400 text-xs font-bold border border-slate-700">
              <Users className="w-3.5 h-3.5" />
              <span>Agentic AI Collaboration</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Cooperating Agents Working For You
            </h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              When you submit a resume, it triggers a chain of specialized micro-agents. They debate skill alignment, crawl keywords, formulate resume sections, and build custom project repositories.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Deterministic ATS grading rules</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Contextual market gap intelligence</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Open-source github reference matches</span>
              </div>
            </div>
          </div>

          {/* Flowchart Representation of Agentic Workflow */}
          <div className="lg:col-span-7">
            <div className="p-6 bg-slate-800/50 border border-slate-700/80 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider">AGENT WORKFLOW ORCHESTRATION</span>
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
              </div>

              <div className="space-y-3.5 relative">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.role}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: agent.delay * 0.1 }}
                    className="flex items-center justify-between p-3.5 bg-slate-800 border border-slate-700 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-900 flex items-center justify-center text-indigo-400">
                        <agent.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{agent.role}</p>
                        <p className="text-[10px] text-slate-400">{agent.status}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-700/80 rounded-md text-[9px] text-indigo-300 font-bold border border-slate-600/40">Active</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="bg-primary rounded-[32px] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-premium">
          {/* Background shine decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-[100px] opacity-30 -mr-32 -mt-32" />
          
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Ready to Navigate Your Job Search?
            </h2>
            <p className="text-indigo-150 text-indigo-100 font-medium text-sm leading-relaxed">
              Get an instant ATS breakdown, discover key engineering gaps, and build your career flight path today with Pilo guiding you.
            </p>
            <div className="pt-2">
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-primary bg-white hover:bg-slate-50 px-8 py-3.5 rounded-xl shadow-md transition-colors group">
                <span>Access Dashboard Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white py-8 px-6 md:px-12 text-center text-xs text-slate-400 font-medium">
        <p>&copy; {new Date().getFullYear()} ResumePilot AI. Built for next-gen engineering seekers.</p>
      </footer>
    </div>
  );
}
