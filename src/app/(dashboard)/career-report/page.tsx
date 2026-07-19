"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Calendar,
  User,
  Briefcase,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  ChevronRight,
  BookOpen,
  Code,
  BookOpenCheck,
  AlertCircle,
  UploadCloud
} from "lucide-react";
import { loadAISettings } from "@/services/aiConfig";
import { Pilo } from "@/components/pilo";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { useATSAnalysis } from "@/hooks/useATSAnalysis";
import { updateResumeMetadata } from "@/services/firestore";
import Link from "next/link";

export default function CareerReportPage() {
  const { getIdToken, profile, user } = useAuth();
  const { currentResume, hasResume: contextHasResume, loading: resumeLoading, refreshResume } = useResume();
  const { atsContext, loading: atsLoading, error: atsError, refreshAnalysis } = useATSAnalysis();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [hasResume, setHasResume] = useState(true);

  const report = atsContext?.career_report || null;
  const loading = atsLoading;
  const error = atsError;

  const handleDownload = async () => {
    const uploadId = currentResume?.resumeId;
    if (!uploadId) {
      setToast({ message: "No active resume upload found to download report.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    setDownloading(true);
    setToast(null);
    
    try {
      const token = await getIdToken();
      const response = await fetch(`http://127.0.0.1:8000/report/${uploadId}/download`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to download PDF career report.");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Career_Report_${uploadId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setToast({ message: "PDF Career Report downloaded successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || "Error generating PDF report.", type: "error" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (resumeLoading) return;
    if (!contextHasResume || !currentResume) {
      setHasResume(false);
    } else {
      setHasResume(true);
    }

    const settings = loadAISettings(user.uid);
    setHasApiKey(!!settings.apiKey);
  }, [user, currentResume, contextHasResume, resumeLoading]);

  const handleGenerate = async () => {
    if (!user || !currentResume) return;
    try {
      setGenerating(true);
      
      const settings = loadAISettings(user.uid);
      if (!settings.apiKey) {
        throw new Error("No API Key Configured. Please configure your Groq API Key in Settings.");
      }

      await refreshAnalysis();
      await refreshResume();
    } catch (err: any) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 font-sans">
        <Pilo state="thinking" size={120} className="animate-bounce" />
        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-slate-800">
            {generating ? "Synthesizing Career Report..." : "Loading Career Report..."}
          </h3>
          <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
            {generating
              ? "Running multi-agent analysis, consolidating ATS audits, and formatting sections."
              : "Fetching report parameters and setting up visual layout."}
          </p>
        </div>
      </div>
    );
  }

  // 1. API key missing banner
  if (!hasApiKey && !loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">API Provider Configuration Required</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650">
            Configure your AI Provider to begin.
          </p>
          <Link
            href="/settings"
            className="inline-flex h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // 2. Resume missing CTA
  if (!hasResume && !loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <UploadCloud className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Resume Uploaded</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650">
            Upload your first resume.
          </p>
          <Link
            href="/upload"
            className="inline-flex h-10 px-5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-800">Report Unavailable</h3>
          <p className="text-xs text-rose-600 font-semibold leading-relaxed">{error}</p>
          <button
            onClick={handleGenerate}
            className="inline-flex h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Retry Generation
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-white border border-border/80 rounded-3xl p-8 max-w-lg text-center space-y-5 shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800">No career reports generated yet.</h3>
            <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650 max-w-md mx-auto">
              Analyze your resume after upload.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex h-11 px-6 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl items-center justify-center transition-colors shadow-soft cursor-pointer"
          >
            Generate your first report
          </button>
        </div>
      </div>
    );
  }

  // Define statuses helper
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pass":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case "pass":
        return "bg-emerald-50/50 border-emerald-100/80 text-emerald-800";
      case "warn":
        return "bg-amber-50/50 border-amber-100/80 text-amber-800";
      case "fail":
        return "bg-rose-50/50 border-rose-100/80 text-rose-800";
      default:
        return "bg-slate-50 border-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* 1. Large Report Cover Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-gradient-to-r from-indigo-650 via-indigo-600 to-violet-750 text-white rounded-3xl p-8 shadow-premium relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #312E81 100%)"
        }}
      >
        <div className="space-y-4 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-[10px] font-bold backdrop-blur-sm border border-white/10 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>AI Career Report v{report.report_version}</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {profile?.name || report.candidate_info?.name || "Unknown Candidate"}
            </h1>
            <p className="text-sm md:text-base text-indigo-100 font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-300" />
              <span>Target Role: {profile?.targetRole || report.target_role}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200 font-medium">
            {(profile?.email || report.candidate_info?.email) && (
              <span className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                {profile?.email || report.candidate_info.email}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span>Generated: {formatDate(report.generated_timestamp)}</span>
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[11px] font-bold transition-all shadow-soft border border-white/20 select-none ${
                downloading
                  ? "bg-white/20 text-indigo-200 cursor-not-allowed animate-pulse"
                  : "bg-white text-indigo-700 hover:bg-indigo-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-indigo-200" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generating PDF Report...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scores indicators */}
        <div className="flex flex-wrap gap-4 items-center z-10 w-full md:w-auto">
          {/* Overall score */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center w-28 h-28 shadow-soft">
            <span className="text-[9px] font-bold text-indigo-200 tracking-wider mb-1">OVERALL</span>
            <span className="text-3xl font-black tracking-tighter">{report.overall_score}</span>
            <span className="text-[8px] font-bold text-indigo-200">OUT OF 100</span>
          </div>

          {/* ATS score */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center w-28 h-28 shadow-soft">
            <span className="text-[9px] font-bold text-indigo-200 tracking-wider mb-1">ATS SCORE</span>
            <span className="text-3xl font-black tracking-tighter">{report.ats_score}</span>
            <span className="text-[8px] font-bold text-indigo-200">OUT OF 100</span>
          </div>

          {/* Job match score */}
          {report.job_match_score !== null && report.job_match_score !== undefined && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center w-28 h-28 shadow-soft">
              <span className="text-[9px] font-bold text-indigo-200 tracking-wider mb-1">JOB MATCH</span>
              <span className="text-3xl font-black tracking-tighter">{report.job_match_score}</span>
              <span className="text-[8px] font-bold text-indigo-200">OUT OF 100</span>
            </div>
          )}
        </div>

        {/* Shine background decorations */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500 rounded-full filter blur-[100px] opacity-35 -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-violet-600 rounded-full filter blur-[80px] opacity-25 -mb-20 pointer-events-none" />
      </motion.div>

      {/* 2. Resume Summary & Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resume Summary */}
        <div className="lg:col-span-2 bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-slate-800">Resume Executive Summary</h3>
          </div>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            {report.resume_summary}
          </p>
        </div>

        {/* Skills Profile */}
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Code className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-slate-800">Skills Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">IDENTIFIED SKILLS</p>
              <div className="flex flex-wrap gap-1.5">
                {report.skills_analysis?.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 bg-indigo-50 text-primary text-xs font-semibold rounded-lg border border-indigo-100/50">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {report.missing_skills?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-rose-400 tracking-wider mb-2">CRITICAL SKILL GAPS</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.missing_skills.map((skill: string) => (
                    <span key={skill} className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. ATS Analysis Checklist */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Cpu className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-slate-800">ATS Formatting & Layout Audit</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {report.ats_analysis?.map((item: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 border rounded-2xl flex flex-col justify-between space-y-3 transition-colors ${getStatusBg(item.status)}`}
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                {getStatusIcon(item.status)}
              </div>
              <p className="text-[11px] opacity-80 font-medium leading-relaxed">
                {item.desc}
              </p>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 self-start">
                Status: {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Project Recommendations & Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project recommendations */}
        <div className="lg:col-span-2 bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-slate-800">Target Project Recommendations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.project_recommendations?.map((proj: any, idx: number) => (
              <div
                key={idx}
                className="p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 rounded-2xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 rounded-md text-[9px] text-primary font-bold border border-indigo-100 uppercase truncate max-w-[125px]">
                      {proj.skills_learned?.[0] || "LEARN"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                      Difficulty: {proj.difficulty}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{proj.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Duration: {proj.duration}</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                    {proj.skills_learned?.slice(0, 2).map((s: string) => (
                      <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[8px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Roadmap */}
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <BookOpenCheck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-slate-800">Learning Roadmap</h3>
          </div>

          <div className="relative pl-4 border-l-2 border-indigo-100 space-y-6 ml-2 py-2">
            {report.learning_roadmap?.map((step: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline Circle */}
                <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary bg-indigo-50 px-1.5 py-0.5 rounded">
                      Step {step.step || idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{step.duration}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{step.topic}</h4>
                  {step.description && (
                    <p className="text-[11px] text-slate-550 font-medium leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Suggestions, Strengths/Weaknesses, Rewrite & References */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strengths & Weaknesses */}
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-slate-800">Key Strengths & Weaknesses</h3>
          </div>

          <div className="space-y-4 text-xs font-medium">
            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Identified Strengths</h4>
              <ul className="space-y-2.5">
                {report.strengths?.map((str: string, i: number) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-650 leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">Areas for Improvement</h4>
              <ul className="space-y-2.5">
                {report.weaknesses?.map((weak: string, i: number) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 text-rose-455 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-650 leading-relaxed">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Rewrite Suggestions */}
        <div className="lg:col-span-2 bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-slate-800">Resume Phrasing Revisions</h3>
          </div>

          <div className="space-y-4">
            {report.resume_rewrite_suggestions?.map((item: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-2 text-[11px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Original Text</span>
                    <p className="text-slate-600 font-semibold line-through bg-rose-50/30 px-2 py-1 rounded">
                      "{item.original}"
                    </p>
                  </div>
                  
                  {/* Improved */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Suggested Rewrite</span>
                    <p className="text-slate-800 font-bold bg-emerald-50/20 px-2 py-1 rounded">
                      "{item.improved}"
                    </p>
                  </div>
                </div>

                {item.rationale && (
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-1 text-[10px] text-slate-450">
                    <span className="font-bold text-primary flex-shrink-0">Rationale:</span>
                    <span className="font-medium text-slate-500">{item.rationale}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RAG References */}
      {report.knowledge_sources_used?.length > 0 && (
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <BookOpen className="w-5 h-5 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-800">Verification & RAG References</h4>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            This analysis was verified against the following indexed professional guideline standards:
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {report.knowledge_sources_used.map((source: string) => (
              <span
                key={source}
                className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200/60 uppercase"
              >
                {source.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-premium border text-xs font-bold ${
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            ) : (
              <XCircle className="w-4.5 h-4.5 text-rose-600" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
