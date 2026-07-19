"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  UploadCloud,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Compass,
  Database,
  Terminal,
  RefreshCw,
  Trophy,
  TrendingUp,
  Check,
  ArrowRight,
  Copy,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface ProjectRecommendation {
  title: string;
  desc: string;
}

interface BulletRewrite {
  original: string;
  improved: string;
  rationale: string;
}

interface ParsedJobDescription {
  company_name: string;
  role: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_required: string;
  responsibilities: string[];
  qualifications: string;
  technologies: string[];
  certifications: string[];
  soft_skills: string[];
}

interface JobMatchDetails {
  overall_match_score: number;
  ats_match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  missing_keywords: string[];
  missing_technologies: string[];
  experience_match: string;
  education_match: string;
  certification_match: string;
  actionable_suggestions: string[];
  projects_to_build: ProjectRecommendation[];
  skills_to_learn: string[];
  keywords_to_add: string[];
  experience_improvements: string[];
  certifications_to_earn: string[];
  bullet_rewrites: BulletRewrite[];
}

interface LiveLog {
  agent: string;
  status: "running" | "completed";
}

import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { loadAISettings } from "@/services/aiConfig";
import { useATSAnalysis } from "@/hooks/useATSAnalysis";
import Link from "next/link";
import { Pilo } from "@/components/pilo";

export default function JobMatchPage() {
  const { getIdToken, user, profile } = useAuth();
  const { currentResume, hasResume: contextHasResume, loading: resumeLoading } = useResume();
  const { atsContext, loading: atsLoading, refreshAnalysis } = useATSAnalysis();
  const [resumeUploadId, setResumeUploadId] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState(true);
  const [hasResume, setHasResume] = useState(true);
  const [checkingState, setCheckingState] = useState(true);

  // Input states
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("paste");
  const [jdText, setJdText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>("Llama 3.3 70B");

  // Loading states
  const [parsing, setParsing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Console Telemetry
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  // Result state
  const [analysis, setAnalysis] = useState<{
    job_match: JobMatchDetails;
    parsed_job_description: ParsedJobDescription;
  } | null>(null);

  const [activeResultsTab, setActiveResultsTab] = useState<"overview" | "gaps" | "bullet-rewrites" | "projects">("overview");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Load resume upload id on load
  useEffect(() => {
    const checkState = async () => {
      if (!user) return;
      if (resumeLoading) return;
      
      try {
        setCheckingState(true);
        // 1. Check API Key
        const settings = loadAISettings(user.uid);
        setHasApiKey(!!settings.apiKey);

        // 2. Resolve resume upload_id from context
        if (!contextHasResume || !currentResume) {
          setHasResume(false);
          setResumeUploadId(null);
        } else {
          setHasResume(true);
          setResumeUploadId(currentResume.resumeId);
          setTargetRole(profile?.targetRole || "Software Engineer");
        }
      } catch (err) {
        console.warn("Failed to check history in job-match", err);
      } finally {
        setCheckingState(false);
      }
    };

    checkState();
  }, [user, currentResume, contextHasResume, resumeLoading, profile?.targetRole]);

  useEffect(() => {
    if (atsContext?.job_match_details && atsContext?.parsed_job_description) {
      setAnalysis({
        job_match: atsContext.job_match_details,
        parsed_job_description: atsContext.parsed_job_description
      });
      if (atsContext.job_description) {
        setJdText(atsContext.job_description);
      }
    } else {
      setAnalysis(null);
    }
  }, [atsContext]);

  // Handle file drop parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      await parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    setParsing(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await getIdToken();
      const res = await fetch("http://127.0.0.1:8000/parse-jd", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to parse job description document");
      }

      const data = await res.json();
      setJdText(data.text);
      setActiveTab("paste"); // Switch tab to show parsed text
    } catch (e: any) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  };

  // Run LangGraph analysis
  const runComparison = async () => {
    if (!jdText.trim()) {
      setError("Please paste or upload a Job Description first.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    // Setup console logs simulation
    const steps = [
      "Document Intelligence",
      "ATS Analyst",
      "Job Match Agent",
      "Project Recommendation Agent",
      "Resume Architect",
      "Report Agent"
    ];

    setLiveLogs([]);
    setCurrentStep(0);

    // Simulated log timeline
    const logIntervals: NodeJS.Timeout[] = [];
    steps.forEach((step, idx) => {
      const t = setTimeout(() => {
        setLiveLogs((prev) => {
          const next = prev.map(log => 
            log.status === "running" ? { ...log, status: "completed" as const } : log
          );
          return [...next, { agent: step, status: "running" as const }];
        });
        setCurrentStep(idx);
      }, idx * 1600);
      logIntervals.push(t);
    });

    try {
      await refreshAnalysis(jdText);

      // Clear timers and finish log items
      logIntervals.forEach(clearTimeout);

      // Show completed state in logs
      setLiveLogs(steps.map(step => ({ agent: step, status: "completed" })));
      setCurrentStep(-1);

    } catch (e: any) {
      setError(e.message);
      setCurrentStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (checkingState) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 font-sans">
        <Pilo state="thinking" size={100} className="animate-bounce" />
        <div className="text-center space-y-2">
          <h3 className="text-sm font-bold text-slate-800">Checking Dashboard State...</h3>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed">
            Verifying AI configurations and parsing resumes...
          </p>
        </div>
      </div>
    );
  }

  // 1. API key missing banner
  if (!hasApiKey) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">API Provider Configuration Required</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
            Configure your AI Provider in Settings to unlock AI features.
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
  if (!hasResume) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <UploadCloud className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Resume Uploaded</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
            Please upload a resume first to run job description matching.
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

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Job Matching & Optimization</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Paste or upload a Job Description to execute semantic alignment mapping and bridge resume gaps.
          </p>
        </div>

        {/* Mascot Guidance */}
        <div className="flex items-center gap-3.5 bg-slate-55 bg-indigo-50/40 border border-indigo-100/60 p-4 rounded-2xl max-w-md">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white flex-shrink-0 text-lg shadow-sm">
            🤖
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-primary tracking-wider block">CO-PILOT PILO SAYS</span>
            <p className="text-[11px] text-slate-600 font-medium leading-normal mt-0.5">
              "Upload a description and I'll route the request to my specialized agents. We'll score keyword densities and write customized projects and bullets for you!"
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Input panel (Col span 5) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 tracking-wider">JOB SPECIFICATION</h3>
                {targetRole && (
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-primary border border-indigo-100 rounded-md font-bold">
                    Target: {targetRole}
                  </span>
                )}
              </div>

              {/* Upload vs Paste Tabs */}
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100/80">
                <button
                  onClick={() => setActiveTab("paste")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "paste"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "upload"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Upload Document
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "paste" ? (
                <div className="space-y-3.5">
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the target job description text here (including required technologies, qualifications, and responsibilities)..."
                    className="w-full h-80 bg-slate-50/50 border border-slate-200 focus:border-primary/80 focus:ring focus:ring-primary/5 rounded-2xl p-4 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none resize-none transition-all"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/30 hover:bg-slate-50/50 transition-colors h-80 relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Drag or Select Document</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Accepts PDF, DOCX, or TXT formats (Max 5MB)
                      </p>
                    </div>
                    {selectedFile && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 mt-2">
                        <FileText className="w-3.5 h-3.5" />
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Error messages */}
              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-start gap-2.5 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-600 font-semibold leading-normal">
                    {error}
                  </p>
                </div>
              )}

              {/* API Key validation helper */}
              {!resumeUploadId && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[11px] text-amber-800 font-bold">No Resume Found</h5>
                    <p className="text-[10px] text-amber-700 font-medium leading-normal mt-0.5">
                      Please go back to the Resume Upload page and process your resume before running job matches.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100/60 mt-6 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Selected Intelligence:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-transparent border-none text-slate-700 font-bold focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="Llama 3.3 70B">Llama 3.3 70B (Default)</option>
                  <option value="DeepSeek R1">DeepSeek R1</option>
                </select>
              </div>

              <button
                onClick={runComparison}
                disabled={loading || parsing || !resumeUploadId}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-soft flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:-translate-y-0 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Engaging Agents...</span>
                  </>
                ) : parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting JD file...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Match Resume & Job Description</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Console Output Panel */}
          {(loading || liveLogs.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-soft space-y-3.5 flex flex-col h-[230px] text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">AI Agent Pipeline Monitor</span>
                </div>
                {loading && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />}
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-indigo-300 space-y-2 pr-1 custom-scrollbar">
                <div className="text-slate-500 font-bold mb-1">&gt; autopilot job matching coordination engaged:</div>
                {liveLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-slate-800/40 pb-1">
                    <div className="flex items-center gap-1.5">
                      {log.status === "running" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span className={log.status === "running" ? "text-indigo-200 font-semibold" : "text-emerald-400"}>
                        {log.agent}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-500">
                      {log.status}
                    </span>
                  </div>
                ))}
                {currentStep !== -1 && (
                  <div className="flex items-center gap-1.5 text-slate-500 italic mt-2">
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    <span>Agent coordinator determining next node...</span>
                  </div>
                )}
                {currentStep === -1 && liveLogs.length > 0 && (
                  <div className="text-emerald-400 font-bold mt-2">&gt; job matching report compiled. Analysis ready.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Dashboard Area (Col span 7) */}
        <div className="xl:col-span-7 flex flex-col">
          <div className="bg-white border border-border/80 rounded-3xl shadow-soft flex-1 flex flex-col overflow-hidden min-h-[500px]">
            
            {analysis ? (
              <div className="flex flex-col h-full">
                
                {/* Header Profile Info */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
                  <div>
                    <h3 className="text-md font-bold text-slate-800 tracking-tight">
                      {analysis.parsed_job_description.role || "Target Role"}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Database className="w-3.5 h-3.5 text-slate-300" />
                      <span>{analysis.parsed_job_description.company_name || "Unknown Company"}</span>
                    </p>
                  </div>
                  
                  {/* Results Tab Menu */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                    {["overview", "gaps", "bullet-rewrites", "projects"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveResultsTab(tab as any)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize ${
                          activeResultsTab === tab
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content area */}
                <div className="p-6 flex-1 overflow-y-auto max-h-[640px] text-left">
                  
                  {/* Tab 1: Overview Dashboard */}
                  {activeResultsTab === "overview" && (
                    <div className="space-y-6">
                      
                      {/* Circular Gauges Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Overall Match Score */}
                        <div className="border border-border/60 bg-slate-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 tracking-wider">OVERALL MATCH SCORE</h4>
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-slate-100 fill-none"
                                strokeWidth="10"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-primary fill-none transition-all duration-1000"
                                strokeWidth="10"
                                strokeDasharray={351.8}
                                strokeDashoffset={351.8 - (351.8 * analysis.job_match.overall_match_score) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                {analysis.job_match.overall_match_score}%
                              </span>
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                                Solid Match
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold max-w-[200px]">
                            {analysis.job_match.experience_match}
                          </p>
                        </div>

                        {/* ATS Match score */}
                        <div className="border border-border/60 bg-slate-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 tracking-wider">ATS ALIGNMENT SCORE</h4>
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-slate-100 fill-none"
                                strokeWidth="10"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-indigo-500 fill-none transition-all duration-1000"
                                strokeWidth="10"
                                strokeDasharray={351.8}
                                strokeDashoffset={351.8 - (351.8 * analysis.job_match.ats_match_percentage) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                {analysis.job_match.ats_match_percentage}%
                              </span>
                              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">
                                Keyword Density
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold max-w-[200px]">
                            {analysis.job_match.education_match}
                          </p>
                        </div>
                      </div>

                      {/* Strengths / Weaknesses checklists */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        {/* Strengths */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-emerald-600 tracking-wider flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>MATCH STRENGTHS</span>
                          </h4>
                          <ul className="space-y-2 text-xs font-medium text-slate-600">
                            {analysis.job_match.matched_skills.slice(0, 4).map((skill, idx) => (
                              <li key={idx} className="flex items-start gap-2 bg-emerald-50/30 border border-emerald-100/50 p-2.5 rounded-xl">
                                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Demonstrated experience in <strong>{skill}</strong>.</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Suggested Improvements */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-amber-600 tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span>SUGGESTED REVISIONS</span>
                          </h4>
                          <ul className="space-y-2 text-xs font-medium text-slate-600">
                            {analysis.job_match.actionable_suggestions.slice(0, 4).map((suggest, idx) => (
                              <li key={idx} className="flex items-start gap-2 bg-amber-50/30 border border-amber-100/50 p-2.5 rounded-xl">
                                <ArrowRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{suggest}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Credentials Check */}
                      <div className="border border-slate-100/80 bg-slate-50/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-xs text-slate-600 font-semibold">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4.5 h-4.5 text-indigo-500" />
                          <span><strong>Education:</strong> {analysis.job_match.education_match}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4.5 h-4.5 text-amber-500" />
                          <span><strong>Certifications:</strong> {analysis.job_match.certification_match}</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Tab 2: Skills & Tech Gaps */}
                  {activeResultsTab === "gaps" && (
                    <div className="space-y-6">
                      
                      {/* Skill Matching bars */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-slate-400 tracking-wider">SKILLS COMPARISON MATRIX</h4>
                        
                        {/* Matched skills badges */}
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-bold text-emerald-500">Matched Skills ({analysis.job_match.matched_skills.length})</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.job_match.matched_skills.map((s) => (
                              <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>{s}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing skills badges */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-100">
                          <h5 className="text-[10px] font-bold text-rose-500">Missing Core Skills ({analysis.job_match.missing_skills.length})</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.job_match.missing_skills.map((s) => (
                              <span key={s} className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                <span>{s}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Technologies */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-100">
                          <h5 className="text-[10px] font-bold text-indigo-500">Missing Technologies & Tools ({analysis.job_match.missing_technologies.length})</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.job_match.missing_technologies.map((t) => (
                              <span key={t} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold rounded-lg">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing ATS Keywords */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-100">
                          <h5 className="text-[10px] font-bold text-amber-500">Missing ATS Keywords & Phrases ({analysis.job_match.missing_keywords.length})</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.job_match.missing_keywords.map((k) => (
                              <span key={k} className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded-lg">
                                ⚠ {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Tab 3: Bullet rewrites */}
                  {activeResultsTab === "bullet-rewrites" && (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-bold text-slate-400 tracking-wider">TAILORED RESUME BULLET SWAPS</h4>
                      </div>

                      <div className="space-y-4">
                        {analysis.job_match.bullet_rewrites.map((rewrite, idx) => (
                          <div key={idx} className="border border-border/80 rounded-2xl p-4 bg-slate-50/20 space-y-3 text-xs">
                            
                            {/* Original */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Original Resume Bullet</span>
                              </span>
                              <p className="text-slate-500 font-semibold italic">"{rewrite.original}"</p>
                            </div>

                            {/* Improved */}
                            <div className="space-y-1.5 pt-2.5 border-t border-dashed border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Suggested Rewrite (Tailored)</span>
                                </span>
                                
                                <button
                                  onClick={() => copyToClipboard(rewrite.improved, idx)}
                                  className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 font-bold text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md hover:border-primary/20"
                                >
                                  {copiedIndex === idx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-500">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-slate-700 font-bold leading-relaxed bg-white border border-slate-200/60 p-3 rounded-xl">
                                "{rewrite.improved}"
                              </p>
                            </div>

                            {/* Rationale */}
                            <div className="text-[10px] text-slate-400 font-semibold bg-indigo-50/20 border border-indigo-100/40 p-2.5 rounded-lg">
                              <span className="text-primary font-bold">RATIONALE:</span> {rewrite.rationale}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Gap-bridging projects */}
                  {activeResultsTab === "projects" && (
                    <div className="space-y-5">
                      <h4 className="text-[11px] font-bold text-slate-400 tracking-wider">GAP-BRIDGING PROJECT PORTFOLIOS</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {analysis.job_match.projects_to_build.map((project, idx) => (
                          <div key={idx} className="bg-white border border-border/80 rounded-2xl p-5 shadow-soft space-y-3 flex flex-col justify-between hover:border-primary/45 transition-colors">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-primary text-[9px] font-bold rounded">
                                  Portfolio Builder
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">Duration: ~2 weeks</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-800">{project.title}</h4>
                              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                {project.desc}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Recruiter-Impacting</span>
                              </span>
                              <a
                                href={`https://github.com/topics/nextjs` /* Real starter hub topic fallback */}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors"
                              >
                                <span>Open Starter Repository</span>
                                <ChevronRight className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-10 py-16 my-auto text-slate-400 min-h-[460px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 mb-4 shadow-sm">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">No Job Description Comparison Loaded</h4>
                  <p className="text-xs text-slate-400 font-semibold max-w-[280px] mx-auto mt-2 leading-relaxed">
                    Paste target requirements or drag a file to extract qualifications, and launch the multi-agent critique comparison.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
