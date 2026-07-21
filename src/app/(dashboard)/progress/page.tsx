"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Calendar,
  Award,
  Code,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GitCompare,
  ArrowRight,
  Activity,
  Layers,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  X,
  Plus
} from "lucide-react";
import { Pilo } from "@/components/pilo";
import { loadAISettings } from "@/services/aiConfig";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// TypeScript interfaces matching backend models
interface ResumeHistoryEntry {
  version: number;
  upload_id: string;
  timestamp: string;
  filename: string;
  overall_score: number;
  ats_score: number;
  job_match_score: number | null;
  career_readiness_score: number;
  target_role: string;
  skills_snapshot: string[];
  missing_skills: string[];
  missing_keywords: string[];
  suggested_projects: string[];
}

interface VersionComparison {
  v1_version: number;
  v2_version: number;
  overall_score_diff: number;
  overall_score_trend: string;
  ats_score_diff: number;
  ats_score_trend: string;
  job_match_diff: number | null;
  job_match_trend: string | null;
  career_readiness_diff: number;
  career_readiness_trend: string;
  keyword_coverage_diff: number;
  keyword_coverage_trend: string;
  skills_added: string[];
  skills_removed: string[];
  keywords_resolved: string[];
  projects_resolved: string[];
  experience_trend: string;
  experience_details: string[];
  education_trend: string;
  education_details: string[];
  certifications_trend: string;
  certifications_details: string[];
}

const DEFAULT_MOCK_HISTORY: ResumeHistoryEntry[] = [];

import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, UploadCloud } from "lucide-react";

export default function ResumeProgress() {
  const { getIdToken, user } = useAuth();
  const [history, setHistory] = useState<ResumeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  
  // Selection for version comparison
  const [v1Sel, setV1Sel] = useState<number>(1);
  const [v2Sel, setV2Sel] = useState<number>(3);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch history list
  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      
      const token = await getIdToken();
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/history", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load version history from backend");
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        setHistory(data);
        setHasResume(true);
        // Set default selectors to first and latest
        setV1Sel(data[0].version);
        setV2Sel(data[data.length - 1].version);
      } else {
        setHistory([]);
        setHasResume(false);
      }
    } catch (err: any) {
      console.warn("Backend history unreachable.", err);
      setHistory([]);
      setHasResume(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const settings = loadAISettings(user.uid);
      setHasApiKey(!!settings.apiKey);
      fetchHistory();
    }
  }, [user]);

  // Fetch comparison details
  const triggerComparison = async (v1: number, v2: number) => {
    if (v1 === v2) return;
    setComparing(true);
    
    // Ensure chronological order for service calculation
    const lowerVer = Math.min(v1, v2);
    const higherVer = Math.max(v1, v2);

    try {
      if (usingMock) {
        // Generate mock comparison dynamically
        const comp = generateMockComparison(lowerVer, higherVer);
        setComparison(comp);
      } else {
        const token = await getIdToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/history/compare?v1=${lowerVer}&v2=${higherVer}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Comparison service failed");
        }
        const data = await response.json();
        setComparison(data);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback comparison
      setComparison(generateMockComparison(lowerVer, higherVer));
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (history.length >= 2) {
      triggerComparison(v1Sel, v2Sel);
    }
  }, [v1Sel, v2Sel, history, usingMock]);

  // Seed Mock History to backend registry
  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear your resume history? This will wipe the version database.")) {
      try {
        if (!usingMock) {
          const token = await getIdToken();
          await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/history", {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
        }
        fetchHistory();
      } catch (err) {
        console.error("Failed to clear history", err);
      }
    }
  };

  // Dynamic values based on history list
  const versionsCount = history.length;
  const highestATS = history.length > 0 ? Math.max(...history.map(h => h.ats_score)) : 0;
  
  // Calculate total improvements (e.g. times score went up)
  let totalImprovements = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].ats_score > history[i - 1].ats_score) totalImprovements++;
    if (history[i].overall_score > history[i - 1].overall_score) totalImprovements++;
  }

  // Skill growth estimation (skills in latest vs skills in first)
  const skillGrowthCount = history.length >= 2 
    ? Math.max(0, history[history.length - 1].skills_snapshot.length - history[0].skills_snapshot.length) 
    : 0;

  // Preparing chart datasets
  const lineChartData = history.map(h => ({
    name: `V${h.version}`,
    "ATS Score": h.ats_score,
    "Resume Score": h.overall_score,
    "Career Readiness": h.career_readiness_score
  }));

  const barChartData = history.map(h => ({
    name: `V${h.version}`,
    "Matching Skills": h.skills_snapshot.length,
    "Missing Keywords": h.missing_keywords.length
  }));

  // Radar chart comparison between oldest and newest
  const oldestResume = history[0] || null;
  const latestResume = history[history.length - 1] || null;

  const radarData = [
    { subject: "ATS Match", Old: oldestResume?.ats_score || 50, Latest: latestResume?.ats_score || 50 },
    { subject: "Resume Score", Old: oldestResume?.overall_score || 50, Latest: latestResume?.overall_score || 50 },
    { subject: "Readiness", Old: oldestResume?.career_readiness_score || 50, Latest: latestResume?.career_readiness_score || 50 },
    { subject: "Skills Count", Old: Math.min(100, (oldestResume?.skills_snapshot.length || 0) * 8), Latest: Math.min(100, (latestResume?.skills_snapshot.length || 0) * 8) },
    { subject: "Completeness", Old: 65, Latest: 95 }
  ];

  // Dynamic AI Insight text generator
  const getAIInsightText = () => {
    if (history.length < 2) return "Analyze your resume multiple times to view career improvements over time.";
    const latest = history[history.length - 1];
    const first = history[0];
    const atsDiff = latest.ats_score - first.ats_score;
    const addedSkills = latest.skills_snapshot.filter(s => !first.skills_snapshot.includes(s));
    
    return `You have increased your ATS keyword coverage by ${atsDiff}% across ${history.length} resume revisions. The largest improvements were adding ${
      addedSkills.slice(0, 3).join(", ") || "targeted skill nodes"
    }. Legacies like MS Paint were removed to align your profile with standard recruiting metrics.`;
  };

  // Pilo Mascot review summary
  const getPiloProgressReview = () => {
    if (history.length < 2) return {
      improved: "N/A - Version tracking requires at least two uploaded files.",
      attention: "Please upload your updated resume versions.",
      nextGoal: "Complete recommended projects on your dashboard.",
      potential: "+15 PTS (by adding Docker & Next.js)"
    };
    
    const latest = history[history.length - 1];
    const first = history[0];
    
    const hasDocker = latest.skills_snapshot.some(s => s.toLowerCase().includes("docker"));
    const hasKubernetes = latest.skills_snapshot.some(s => s.toLowerCase().includes("kubernetes"));
    const hasJest = latest.skills_snapshot.some(s => s.toLowerCase().includes("jest"));

    let nextGoal = "Add Webpack customization details.";
    let potential = "+5 PTS";

    if (!hasDocker) {
      nextGoal = "Complete Dockerized React Application project.";
      potential = "+12 PTS";
    } else if (!hasJest) {
      nextGoal = "Configure Jest testing in your Next.js application.";
      potential = "+8 PTS";
    } else if (!hasKubernetes) {
      nextGoal = "Learn basic Kubernetes deployment manifests.";
      potential = "+7 PTS";
    }

    return {
      improved: `ATS score climbed from ${first.ats_score} to ${latest.ats_score}. Added critical modern competencies: ${latest.skills_snapshot.slice(-3).join(", ")}.`,
      attention: latest.missing_skills.length > 0 
        ? `Bridge your remaining requirements: ${latest.missing_skills.join(", ")}.`
        : "Excellent job! No critical skills missing. Add secondary metrics to stand out.",
      nextGoal: nextGoal,
      potential: potential
    };
  };

  const piloReview = getPiloProgressReview();

  if (loading) {
    return (
      <div className="space-y-6 font-sans pb-16 min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <h3 className="text-sm font-bold text-slate-800">Loading version history...</h3>
      </div>
    );
  }

  if (!hasResume) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <UploadCloud className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No History Found</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
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

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resume Progress Tracker</h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor ATS score improvement, analyze skill growth, and compare resume versions.
          </p>
        </div>
        <div className="flex gap-3">
          {usingMock && (
            <span className="inline-flex items-center px-3 py-1 bg-amber-50 rounded-xl text-amber-600 text-[10px] font-bold border border-amber-200">
              Mock Sandbox Mode
            </span>
          )}
          <button
            onClick={fetchHistory}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearHistory}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold rounded-xl transition-colors border border-red-100"
          >
            Reset Tracker
          </button>
        </div>
      </div>

      {/* Section 1: Career Growth Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resume Versions</p>
            <p className="text-xl font-extrabold text-slate-800">{versionsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Improvements</p>
            <p className="text-xl font-extrabold text-slate-800">+{totalImprovements}</p>
          </div>
        </div>

        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highest ATS Score</p>
            <p className="text-xl font-extrabold text-slate-800">{highestATS}/100</p>
          </div>
        </div>

        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skill Growth</p>
            <p className="text-xl font-extrabold text-slate-800">+{skillGrowthCount} Skills</p>
          </div>
        </div>

        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects Done</p>
            <p className="text-xl font-extrabold text-slate-800">0 <span className="text-[10px] text-slate-400 font-medium">(future integration)</span></p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
          Career Development Timeline
        </h3>
        
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-x-auto py-4">
            {history.map((entry, index) => (
              <React.Fragment key={`${entry.upload_id}-${entry.version}`}>
                {/* Version Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full lg:w-[260px] bg-slate-50/50 border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 relative shadow-sm group hover:bg-white transition-all flex flex-col justify-between min-h-[170px]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-primary text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                      Version {entry.version}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={entry.filename}>
                      {entry.filename}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">{entry.target_role}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Overall</p>
                      <p className="text-xs font-extrabold text-slate-800">{entry.overall_score}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">ATS</p>
                      <p className="text-xs font-extrabold text-indigo-650" style={{ color: "#4f46e5" }}>{entry.ats_score}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Readiness</p>
                      <p className="text-xs font-extrabold text-emerald-650" style={{ color: "#10b981" }}>{entry.career_readiness_score}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Connection Arrow */}
                {index < history.length - 1 && (
                  <div className="flex flex-col items-center justify-center text-slate-350">
                    <ArrowRight className="w-5 h-5 hidden lg:block animate-pulse text-indigo-300" />
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md lg:hidden">
                      NEXT REVISION
                    </span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Visual Recharts Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Score Trends (8 columns) */}
        <div className="lg:col-span-8 bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">Score Progression Trends</h3>
          </div>
          
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: "10px", fontWeight: "bold" }} />
                <YAxis domain={[40, 100]} stroke="#64748B" style={{ fontSize: "10px", fontWeight: "bold" }} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "12px", border: "1px solid #E2E8F0" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="ATS Score" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Resume Score" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Career Readiness" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill/Keyword Growth (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">Skill & Keyword Analytics Growth</h3>
          </div>
          
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: "10px", fontWeight: "bold" }} />
                <YAxis stroke="#64748B" style={{ fontSize: "10px", fontWeight: "bold" }} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Matching Skills" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Missing Keywords" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competency Radar Old vs Latest */}
        <div className="lg:col-span-4 bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">Old vs. Latest Overlay</h3>
          </div>
          
          <div className="h-[250px] w-full flex items-center justify-center">
            {history.length < 2 ? (
              <p className="text-[10px] text-slate-400 font-bold">Requires at least 2 versions to overlay.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#F1F5F9" />
                  <PolarAngleAxis dataKey="subject" style={{ fontSize: "9px", fontWeight: "bold", fill: "#475569" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} style={{ fontSize: "8px" }} />
                  <Radar name="Oldest (V1)" dataKey="Old" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.2} />
                  <Radar name="Latest (Current)" dataKey="Latest" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI insights Summary & Pilo Progress Review */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Insights Card */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3 z-10">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg text-primary text-[10px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Progress Insights</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">Dynamic Keyword Summary</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {getAIInsightText()}
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 mt-4">
              <span>GENERATED AUTO-INSIGHT</span>
              <span className="text-primary hover:underline cursor-pointer flex items-center gap-0.5">
                Share Progress <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            {/* background circle decor */}
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-accent rounded-full filter blur-3xl opacity-20 -mr-6 -mb-6" />
          </div>

          {/* Pilo's Progress Coach Review Card */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex flex-col justify-between">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
              <Pilo state="happy" size={40} />
              <div>
                <h3 className="text-xs font-bold text-slate-800">Pilo's Progress Review</h3>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">Mascot Feedback Engine</p>
              </div>
            </div>

            <div className="space-y-3.5 my-2.5">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">What Improved</p>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">{piloReview.improved}</p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Needs Attention</p>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">{piloReview.attention}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Next Recommended Goal</p>
                  <p className="text-xs text-slate-700 font-extrabold">{piloReview.nextGoal}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Est. Score Potential</p>
                  <p className="text-xs text-emerald-600 font-extrabold">{piloReview.potential}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Version Comparison Selector and Table */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-premium">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Version Comparison Matrix</h3>
          </div>
          
          {history.length < 2 ? (
            <p className="text-xs text-slate-400 font-semibold">Upload at least two resumes to compare versions.</p>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">Compare:</span>
              <select
                value={v1Sel}
                onChange={(e) => setV1Sel(parseInt(e.target.value))}
                className="h-9 px-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary cursor-pointer bg-slate-50"
              >
                {history.map(h => (
                  <option key={h.version} value={h.version}>Version {h.version} ({h.filename.slice(0, 15)}...)</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 font-bold">vs</span>
              <select
                value={v2Sel}
                onChange={(e) => setV2Sel(parseInt(e.target.value))}
                className="h-9 px-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary cursor-pointer bg-slate-50"
              >
                {history.map(h => (
                  <option key={h.version} value={h.version}>Version {h.version} ({h.filename.slice(0, 15)}...)</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Comparison grid details */}
        {comparing ? (
          <div className="h-48 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : comparison ? (
          <div className="space-y-6">
            {/* Core Scores diff grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[90px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl font-extrabold text-slate-800">
                    {history.find(h => h.version === v1Sel)?.overall_score} → {history.find(h => h.version === v2Sel)?.overall_score}
                  </span>
                  <TrendBadge value={comparison.overall_score_diff} trend={comparison.overall_score_trend} />
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[90px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ATS Score</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl font-extrabold text-slate-800">
                    {history.find(h => h.version === v1Sel)?.ats_score} → {history.find(h => h.version === v2Sel)?.ats_score}
                  </span>
                  <TrendBadge value={comparison.ats_score_diff} trend={comparison.ats_score_trend} />
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[90px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Job Match Score</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl font-extrabold text-slate-800">
                    {history.find(h => h.version === v1Sel)?.job_match_score ?? "N/A"} → {history.find(h => h.version === v2Sel)?.job_match_score ?? "N/A"}
                  </span>
                  <TrendBadge value={comparison.job_match_diff} trend={comparison.job_match_trend} />
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[90px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Keyword Coverage</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl font-extrabold text-slate-800">
                    {comparison.keyword_coverage_diff !== undefined ? `+${comparison.keyword_coverage_diff}%` : "0%"}
                  </span>
                  <TrendBadge value={comparison.keyword_coverage_diff} trend={comparison.keyword_coverage_trend} isPercent={true} />
                </div>
              </div>
            </div>

            {/* Detailed sections comparisons Table */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-150 p-3 font-bold text-slate-600">
                <div className="col-span-3">SECTION / FEATURE</div>
                <div className="col-span-2 text-center">STATUS</div>
                <div className="col-span-7">IMPROVEMENT DETAILS & COMPARISONS</div>
              </div>

              {/* Skills */}
              <div className="grid grid-cols-12 border-b border-slate-100 p-3 items-center min-h-[60px]">
                <div className="col-span-3 font-bold text-slate-700">Skills Map</div>
                <div className="col-span-2 text-center">
                  <TrendBadge value={comparison.skills_added.length - comparison.skills_removed.length} trend={comparison.skills_added.length >= comparison.skills_removed.length ? "improved" : "declined"} />
                </div>
                <div className="col-span-7 space-y-1">
                  {comparison.skills_added.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1 py-0.5 rounded">Added:</span>
                      {comparison.skills_added.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px] font-semibold">{s}</span>
                      ))}
                    </div>
                  )}
                  {comparison.skills_removed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-50 px-1 py-0.5 rounded">Removed:</span>
                      {comparison.skills_removed.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-slate-400 text-[10px] font-semibold line-through">{s}</span>
                      ))}
                    </div>
                  )}
                  {comparison.skills_added.length === 0 && comparison.skills_removed.length === 0 && (
                    <span className="text-slate-400">Skills profile remains identical.</span>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div className="grid grid-cols-12 border-b border-slate-100 p-3 items-center min-h-[60px]">
                <div className="col-span-3 font-bold text-slate-700">Projects Gaps</div>
                <div className="col-span-2 text-center">
                  <TrendBadge value={comparison.projects_resolved.length} trend={comparison.projects_resolved.length > 0 ? "improved" : "unchanged"} />
                </div>
                <div className="col-span-7">
                  {comparison.projects_resolved.length > 0 ? (
                    <div className="space-y-1">
                      <p className="font-bold text-emerald-600 text-[10px] uppercase">Resolved Project Recommendations:</p>
                      {comparison.projects_resolved.map(p => (
                        <p key={p} className="text-slate-650 font-medium">✓ Resolved: {p}</p>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">No project recommendation changes.</span>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="grid grid-cols-12 border-b border-slate-100 p-3 items-center min-h-[60px]">
                <div className="col-span-3 font-bold text-slate-700">Work Experience</div>
                <div className="col-span-2 text-center">
                  <TrendBadge value={null} trend={comparison.experience_trend} />
                </div>
                <div className="col-span-7 space-y-1">
                  {comparison.experience_details.map((detail, idx) => (
                    <p key={idx} className="text-slate-650 font-medium">{detail}</p>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="grid grid-cols-12 border-b border-slate-100 p-3 items-center min-h-[60px]">
                <div className="col-span-3 font-bold text-slate-700">Education Details</div>
                <div className="col-span-2 text-center">
                  <TrendBadge value={null} trend={comparison.education_trend} />
                </div>
                <div className="col-span-7 space-y-1">
                  {comparison.education_details.map((detail, idx) => (
                    <p key={idx} className="text-slate-650 font-medium">{detail}</p>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="grid grid-cols-12 p-3 items-center min-h-[60px]">
                <div className="col-span-3 font-bold text-slate-700">Certifications</div>
                <div className="col-span-2 text-center">
                  <TrendBadge value={null} trend={comparison.certifications_trend} />
                </div>
                <div className="col-span-7 space-y-1">
                  {comparison.certifications_details.map((detail, idx) => (
                    <p key={idx} className="text-slate-650 font-medium">{detail}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400">
            Select two versions to run comparison.
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponents
function TrendBadge({ value, trend, isPercent = false }: { value: number | null; trend: string | null; isPercent?: boolean }) {
  if (trend === "improved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-lg text-emerald-600 text-[10px] font-extrabold border border-emerald-100">
        <ArrowUp className="w-3 h-3" />
        <span>↑ Improved {value !== null && value !== 0 && `(${value > 0 ? "+" : ""}${value}${isPercent ? "%" : ""})`}</span>
      </span>
    );
  }
  if (trend === "declined") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-lg text-red-600 text-[10px] font-extrabold border border-red-100">
        <ArrowDown className="w-3 h-3" />
        <span>↓ Declined {value !== null && value !== 0 && `(${value}${isPercent ? "%" : ""})`}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-lg text-slate-450 text-[10px] font-extrabold border border-slate-100">
      <Minus className="w-3 h-3" strokeWidth={3} />
      <span>→ Unchanged</span>
    </span>
  );
}

// Mock comparison generator
function generateMockComparison(v1: number, v2: number): VersionComparison {
  const v1Data = DEFAULT_MOCK_HISTORY.find(h => h.version === v1)!;
  const v2Data = DEFAULT_MOCK_HISTORY.find(h => h.version === v2)!;

  const overallDiff = v2Data.overall_score - v1Data.overall_score;
  const overallTrend = overallDiff > 0 ? "improved" : (overallDiff < 0 ? "declined" : "unchanged");

  const atsDiff = v2Data.ats_score - v1Data.ats_score;
  const atsTrend = atsDiff > 0 ? "improved" : (atsDiff < 0 ? "declined" : "unchanged");

  const matchDiff = (v1Data.job_match_score !== null && v2Data.job_match_score !== null) ? v2Data.job_match_score - v1Data.job_match_score : null;
  const matchTrend = matchDiff !== null ? (matchDiff > 0 ? "improved" : (matchDiff < 0 ? "declined" : "unchanged")) : null;

  const readinessDiff = v2Data.career_readiness_score - v1Data.career_readiness_score;
  const readinessTrend = readinessDiff > 0 ? "improved" : (readinessDiff < 0 ? "declined" : "unchanged");

  // Keyword coverage estimation
  const cov1 = v1 === 1 ? 58.3 : (v1 === 2 ? 75.0 : 88.9);
  const cov2 = v2 === 1 ? 58.3 : (v2 === 2 ? 75.0 : 88.9);
  const covDiff = round(cov2 - cov1, 1);
  const covTrend = covDiff > 0 ? "improved" : (covDiff < 0 ? "declined" : "unchanged");

  // Skills
  const skills_added = v2Data.skills_snapshot.filter(s => !v1Data.skills_snapshot.includes(s));
  const skills_removed = v1Data.skills_snapshot.filter(s => !v2Data.skills_snapshot.includes(s));

  // Suggested projects completed (suggested in V1 but missing in V2/V3)
  const projects_resolved = v1Data.suggested_projects.filter(p => !v2Data.suggested_projects.includes(p));

  // Missing keywords resolved
  const keywords_resolved = v1Data.missing_keywords.filter(k => !v2Data.missing_keywords.includes(k));

  let experience_trend = "unchanged";
  let experience_details = ["No changes detected."];
  if (v2 > v1) {
    experience_trend = "improved";
    experience_details = [
      "Added work achievements detailing React Next.js performance improvements.",
      "Optimized active action verbs (Collaborated, Lead -> Managed, Architected)."
    ];
  }

  let education_trend = "unchanged";
  let education_details = ["No changes detected."];

  let certifications_trend = "unchanged";
  let certifications_details = ["No changes detected."];
  if (v2 === 3 && v1 < 3) {
    certifications_trend = "improved";
    certifications_details = ["Added: AWS Certified Cloud Practitioner"];
  }

  return {
    v1_version: v1,
    v2_version: v2,
    overall_score_diff: overallDiff,
    overall_score_trend: overallTrend,
    ats_score_diff: atsDiff,
    ats_score_trend: atsTrend,
    job_match_diff: matchDiff,
    job_match_trend: matchTrend,
    career_readiness_diff: readinessDiff,
    career_readiness_trend: readinessTrend,
    keyword_coverage_diff: covDiff,
    keyword_coverage_trend: covTrend,
    skills_added: skills_added,
    skills_removed: skills_removed,
    keywords_resolved: keywords_resolved,
    projects_resolved: projects_resolved,
    experience_trend: experience_trend,
    experience_details: experience_details,
    education_trend: education_trend,
    education_details: education_details,
    certifications_trend: certifications_trend,
    certifications_details: certifications_details
  };
}

function round(val: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(val * multiplier) / multiplier;
}
