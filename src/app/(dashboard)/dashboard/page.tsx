"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  Code,
  Terminal,
  Activity,
  ChevronRight,
  Sparkles,
  RefreshCw,
  XCircle,
  Database,
  Radar,
  PieChart,
  BarChart3,
  AlignLeft,
  Calendar,
  Route,
  AlertTriangle,
  UploadCloud
} from "lucide-react";
import { Pilo } from "@/components/pilo";
import { loadAISettings } from "@/services/aiConfig";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { useATSAnalysis } from "@/hooks/useATSAnalysis";
import { fetchUserResumes, updateResumeMetadata } from "@/services/firestore";

// Import custom analytics components
import { KPICards } from "@/components/dashboard/kpiCards";
import { CareerRadar } from "@/components/dashboard/careerRadar";
import { SkillGapAnalysis } from "@/components/dashboard/skillGapAnalysis";
import { KeywordAnalytics } from "@/components/dashboard/keywordAnalytics";
import { ATSBreakdown } from "@/components/dashboard/atsBreakdown";
import { ProjectAnalytics } from "@/components/dashboard/projectAnalytics";
import { InteractiveRoadmap } from "@/components/dashboard/interactiveRoadmap";
import { AgentActivityFeed } from "@/components/dashboard/agentActivityFeed";
import { PiloInsights } from "@/components/dashboard/piloInsights";
import { CareerSnapshot } from "@/components/dashboard/careerSnapshot";

const ChartSkeleton = () => (
  <div className="w-full h-[240px] bg-slate-50/50 animate-pulse rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
    <div className="flex flex-col items-center gap-2">
      <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
      <span className="text-[10px] font-bold text-slate-400">Loading Analytics...</span>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, getIdToken, profile } = useAuth();
  const { currentResume, hasResume: contextHasResume, loading: resumeLoading } = useResume();
  const { atsContext, loading: atsLoading } = useATSAnalysis();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [targetRole, setTargetRole] = useState(profile?.targetRole || "Not specified");
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [hasResume, setHasResume] = useState(true);
  const [kbStatus, setKbStatus] = useState<any>({
    indexed_documents: 0,
    embedding_model: "all-MiniLM-L6-v2",
    vector_database: "ChromaDB",
    last_indexed: "Loading...",
    retrieval_status: "Pending"
  });

  useEffect(() => {
    if (profile?.targetRole) {
      setTargetRole(profile.targetRole);
    }
  }, [profile]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      if (resumeLoading) return;
      if (!contextHasResume || !currentResume) {
        setHasResume(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setHasResume(true);

        // 1. Check user API key configuration (isolated per uid)
        const settings = loadAISettings(user.uid);
        const apiKeyExists = !!settings.apiKey;
        setHasApiKey(apiKeyExists);

        // 2. Fetch user's uploaded resumes from history
        let historyData: any[] = [];
        try {
          historyData = await fetchUserResumes(user.uid) || [];
          setHistoryList(historyData);
        } catch (err) {
          console.warn("Failed to fetch resume history", err);
        }

        // 3. Fetch knowledge base status
        try {
          const token = await getIdToken();
          const kbResponse = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/knowledge-base/status", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (kbResponse.ok) {
            const kbData = await kbResponse.json();
            setKbStatus(kbData);
          }
        } catch (kbErr) {
          console.error("Failed to fetch knowledge base status:", kbErr);
        }

      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, currentResume, contextHasResume, resumeLoading]);

  useEffect(() => {
    setLoading(atsLoading);
  }, [atsLoading]);

  useEffect(() => {
    if (atsContext) {
      const compatibleData = {
        ...atsContext,
        overall_score: atsContext.ats_score,
        skills_analysis: atsContext.matched_skills,
        project_recommendations: atsContext.recommended_projects,
        ats_analysis: atsContext.resume_health?.checklist,
        resume_rewrite_suggestions: atsContext.suggested_improvements
      };
      setAnalysisData(compatibleData);
      
      const uploadId = currentResume?.resumeId;
      if (uploadId && atsContext.ats_score && atsContext.ats_score !== currentResume.latestATSScore) {
        updateResumeMetadata(uploadId, { latestATSScore: atsContext.ats_score }).catch(console.error);
      }
      
      const timeline = atsContext.career_report?.execution_timeline || [];
      if (timeline.length > 0) {
        animateTimeline(timeline);
      } else {
        const fallbackTimeline = [
          { agent: "Workflow Coordinator", status: "completed", duration_ms: 15 },
          { agent: "Document Intelligence", status: "completed", duration_ms: 120 },
          { agent: "ATS Analyst", status: "completed", duration_ms: 320 },
          { agent: "Job Match", status: "completed", duration_ms: 220 },
          { agent: "Knowledge Agent", status: "completed", duration_ms: 180 },
          { agent: "Report Agent", status: "completed", duration_ms: 150 }
        ];
        animateTimeline(fallbackTimeline);
      }
    } else {
      setAnalysisData(null);
    }
  }, [atsContext, currentResume]);

  const animateTimeline = (timeline: any[]) => {
    setLiveLogs([]);
    let idx = 0;
    
    const nextStep = () => {
      if (idx < timeline.length) {
        setCurrentStep(idx);
        const item = timeline[idx];
        
        setLiveLogs((prev) => [
          ...prev, 
          { name: item.agent, status: "running", time: null }
        ]);

        setTimeout(() => {
          setLiveLogs((prev) => {
            const updated = [...prev];
            if (updated[idx]) {
              updated[idx] = { name: item.agent, status: item.status || "completed", time: `${Math.round(item.duration_ms || 150)}ms` };
            }
            return updated;
          });
          idx++;
          setTimeout(nextStep, 150);
        }, 600);
      } else {
        setCurrentStep(-1);
        setLoading(false);
      }
    };

    nextStep();
  };

  const activeAnalysis = analysisData
    ? {
        ...analysisData,
        score: analysisData.overall_score !== undefined ? analysisData.overall_score : (analysisData.score || 0),
        ats_score: analysisData.ats_score !== undefined ? analysisData.ats_score : (analysisData.overall_score !== undefined ? Math.max(0, analysisData.overall_score - 5) : 0),
        matching_skills: analysisData.skills_analysis || analysisData.current_skills || analysisData.matching_skills || [],
        missing_skills: analysisData.missing_skills || analysisData.skill_gap || [],
        recommended_projects: analysisData.project_recommendations || analysisData.recommended_projects || [],
        learning_roadmap: analysisData.learning_roadmap || [],
        checklist: analysisData.ats_analysis || analysisData.checklist || [],
        revisions: analysisData.resume_rewrite_suggestions || analysisData.revisions || []
      }
    : {
        score: 0,
        ats_score: 0,
        matching_skills: [],
        missing_skills: [],
        keyword_analytics: {
          matched: [],
          missing: [],
          duplicate: {},
          unused: [],
          coverage_percentage: 0.0,
          matched_count: 0,
          missing_count: 0,
          duplicate_count: 0,
          unused_count: 0
        },
        recommended_projects: [],
        learning_roadmap: [],
        checklist: [],
        revisions: []
      };

  // Aggregate values for our visual components
  const radarData = [
    { subject: "Skills", score: activeAnalysis.matching_skills?.length ? Math.min(100, Math.round((activeAnalysis.matching_skills.length / (activeAnalysis.matching_skills.length + (activeAnalysis.missing_skills?.length || 0))) * 100)) : 65, fullMark: 100 },
    { subject: "Projects", score: activeAnalysis.recommended_projects?.length ? Math.min(100, activeAnalysis.recommended_projects.length * 25) : 70, fullMark: 100 },
    { subject: "Experience", score: activeAnalysis.job_match?.experience_match?.toLowerCase().includes("full") ? 95 : 60, fullMark: 100 },
    { subject: "Education", score: activeAnalysis.job_match?.education_match?.toLowerCase().includes("full") ? 95 : 70, fullMark: 100 },
    { subject: "Communication", score: 85, fullMark: 100 },
    { subject: "ATS Compatibility", score: activeAnalysis.score || 78, fullMark: 100 },
  ];

  const skillGaps = [
    ...(activeAnalysis.missing_skills || []).map((s: string) => ({ name: s, current: 15, target: 90 })),
    ...(activeAnalysis.matching_skills || []).slice(0, 3).map((s: string) => ({ name: s, current: 90, target: 100 }))
  ];

  const keywordData = [
    { name: "Matched Keywords", value: activeAnalysis.matching_skills?.length || 8 },
    { name: "Missing Keywords", value: activeAnalysis.missing_skills?.length || 4 },
    { name: "Duplicate Keywords", value: 2 },
    { name: "Unused Keywords", value: 4 },
  ];

  const getScoreFromStatus = (status: string) => {
    if (status === "pass") return 95;
    if (status === "warn") return 75;
    return 45;
  };

  const atsBreakdownMetrics = [
    {
      name: "Formatting",
      score: getScoreFromStatus(activeAnalysis.checklist?.find((c: any) => c.title.includes("Layout"))?.status || "pass"),
      color: "bg-indigo-500",
      explanation: activeAnalysis.checklist?.find((c: any) => c.title.includes("Layout"))?.desc || "Structure matches templates."
    },
    {
      name: "Readability",
      score: getScoreFromStatus(activeAnalysis.checklist?.find((c: any) => c.title.includes("Grammar"))?.status || "pass"),
      color: "bg-blue-500",
      explanation: activeAnalysis.checklist?.find((c: any) => c.title.includes("Grammar"))?.desc || "Grammar evaluation completed."
    },
    {
      name: "Projects",
      score: getScoreFromStatus(activeAnalysis.checklist?.find((c: any) => c.title.includes("Projects"))?.status || "pass"),
      color: "bg-emerald-500",
      explanation: activeAnalysis.checklist?.find((c: any) => c.title.includes("Projects"))?.desc || "Contribution indexes verified."
    },
    {
      name: "Achievements",
      score: getScoreFromStatus(activeAnalysis.checklist?.find((c: any) => c.title.includes("Experience"))?.status || "pass"),
      color: "bg-violet-500",
      explanation: activeAnalysis.checklist?.find((c: any) => c.title.includes("Experience"))?.desc || "Achievements weight evaluated."
    },
    {
      name: "Action Verbs",
      score: getScoreFromStatus(activeAnalysis.checklist?.find((c: any) => c.title.includes("Active"))?.status || "warn"),
      color: "bg-amber-500",
      explanation: activeAnalysis.checklist?.find((c: any) => c.title.includes("Active"))?.desc || "Active verb threshold critiques."
    },
    {
      name: "Section Completeness",
      score: getScoreFromStatus(activeAnalysis.checklist?.find((c: any) => c.title.includes("Overall"))?.status || "pass"),
      color: "bg-pink-500",
      explanation: activeAnalysis.checklist?.find((c: any) => c.title.includes("Overall"))?.desc || "Section completeness checked."
    }
  ];

  const defaultRoadmap: any[] = [];

  const roadmapSteps = activeAnalysis.learning_roadmap && activeAnalysis.learning_roadmap.length > 0 ? activeAnalysis.learning_roadmap.map((s: any, idx: number) => ({
    step: s.step || idx + 1,
    topic: s.topic,
    duration: s.duration,
    description: s.description || `Master target skills related to ${s.topic} using hands-on repositories.`,
    status: s.status || (idx === 0 ? "in-progress" : "not-started")
  })) : defaultRoadmap;

  // Extract next skill and remaining gaps
  const nextSkill = activeAnalysis.learning_roadmap?.[0]?.topic || activeAnalysis.missing_skills?.[0] || "Core Concepts";
  const remainingSkills = activeAnalysis.missing_skills || [];
  const timeline = profile?.targetTimeline || "6 Months";
  const studyHours = profile?.studyHoursPerWeek || "15";

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center p-6 py-12 text-center space-y-3 font-sans h-full min-h-[200px] w-full bg-slate-50/30 border border-dashed border-slate-200 rounded-2xl select-none">
      <AlertTriangle className="w-6 h-6 text-slate-400" />
      <span className="text-xs text-slate-500 font-semibold leading-normal">{message}</span>
    </div>
  );

  const snapshotProps = {
    targetRole: targetRole,
    careerReadiness: activeAnalysis.score || 75,
    nextSkill: nextSkill,
    remainingSkills: remainingSkills,
    timeline: timeline,
    studyHours: studyHours
  };

  // If resume exists but analysis is still running and there is no cached analysis data yet
  if (loading && !analysisData && hasResume) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 font-sans">
        <Pilo state="thinking" size={120} className="animate-bounce" />
        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-slate-800">Analyzing Resume...</h3>
          <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
            Running multi-agent analysis, consolidating ATS audits, and formatting sections.
          </p>
        </div>
      </div>
    );
  }

  // Conditionally render empty state if no resume has been uploaded yet
  if (!hasResume && !loading) {
    const onboardingItems = [
      { label: "API Key", status: hasApiKey ? "Configured" : "Not Configured", isOk: hasApiKey },
      { label: "Resume", status: "Not Uploaded", isOk: false },
      { label: "Career Goal", status: (profile?.targetRole && profile?.targetRole !== "Not specified") ? "Selected" : "Not Selected", isOk: !!(profile?.targetRole && profile?.targetRole !== "Not specified") },
      { label: "Analysis", status: "Unavailable", isOk: false },
      { label: "Project Hub", status: "Unavailable", isOk: false },
      { label: "Career Report", status: "Unavailable", isOk: false }
    ];

    return (
      <div className="space-y-6 font-sans pb-16">
        {/* API Key warning banner */}
        {!hasApiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-bold text-slate-800">API Provider Configuration Required</h4>
                <p className="text-[10px] text-slate-500 font-semibold">Configure your AI Provider in Settings to unlock AI features.</p>
              </div>
            </div>
            <Link href="/settings" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-xl transition-colors">
              Configure Settings
            </Link>
          </div>
        )}

        {/* Onboarding Checklist Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {onboardingItems.map((item, idx) => (
            <div key={idx} className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex flex-col justify-between items-center text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${item.isOk ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Mascot Greeting */}
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="flex-shrink-0 pt-2">
            <Pilo state="happy" size={90} />
          </div>
          <div className="space-y-3 text-center md:text-left z-10 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg text-primary text-[10px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilo's Insights</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Welcome to ResumePilot.ai, {profile?.name || "pilot"}!
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
              Let's upload your first resume to begin! Our AI agents will audit your skills, analyze keyword matches, recommend matching projects, and draw interactive roadmap milestones.
            </p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-accent rounded-full filter blur-[60px] opacity-40 -mr-10 -mt-10" />
        </div>

        {/* Onboarding Upload Panel */}
        <div className="bg-white border border-border/80 rounded-3xl p-10 shadow-soft text-center py-20 flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 shadow-soft">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Upload your first resume</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-normal">
              No analysis or scores are available because you haven't uploaded a resume yet. Upload a PDF resume to initialize your workspace.
            </p>
          </div>
          <Link href="/upload" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft transition-all">
            Upload Your Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* API Key warning banner */}
      {!hasApiKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-bold text-slate-800">API Provider Configuration Required</h4>
              <p className="text-[10px] text-slate-500 font-semibold">Configure your AI Provider in Settings to unlock AI features.</p>
            </div>
          </div>
          <Link href="/settings" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-xl transition-colors">
            Configure Settings
          </Link>
        </div>
      )}

      {/* Welcome Banner / Overview */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Mascot Greeting */}
        <div className="flex-1 bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="flex-shrink-0 pt-2">
            <Pilo state={loading ? "thinking" : "happy"} size={90} />
          </div>
          <div className="space-y-3 text-center md:text-left z-10 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg text-primary text-[10px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilo's Insights</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {loading ? "Core agents coordinating analysis..." : `Let's boost your resume value, ${profile?.name || "pilot"}!`}
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
              {loading 
                ? "Our Multi-Agent Supervisor is actively dispatching workers to critique your document sections against your target role. Please stand by." 
                : !hasApiKey
                ? "Configure your AI Provider to begin."
                : !hasResume
                ? "Upload your first resume."
                : !analysisData
                ? "Analyze your resume after upload."
                : `We parsed your resume for a target role of ${targetRole}. You scored a strong ${activeAnalysis.score}/100, but adding ${activeAnalysis.missing_skills?.[0] || "Docker"} and testing projects will significantly upgrade your profile.`
              }
            </p>
            <div className="pt-1.5 flex flex-wrap justify-center md:justify-start gap-3">
              <Link href="/analysis" className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft transition-colors">
                View Analysis Details
              </Link>
              <Link href="/career-report" className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-soft transition-colors" style={{ backgroundColor: "#4F46E5" }}>
                Generate Career Report
              </Link>
              <Link href="/projects" className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl shadow-soft transition-colors">
                Explore Matching Projects
              </Link>
            </div>
          </div>
          {/* Shine effect */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-accent rounded-full filter blur-[60px] opacity-40 -mr-10 -mt-10" />
        </div>

        {/* Score widget */}
        <div className="w-full lg:w-[280px] bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-3">OVERALL RESUME SCORE</span>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Radial Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#EEF2FF" strokeWidth="8" fill="transparent" />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="#4F46E5"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * activeAnalysis.score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tighter">{activeAnalysis.score}</span>
              <span className="text-[9px] font-bold text-slate-400">OF 100</span>
            </div>
          </div>

          <div className="flex gap-2 items-center text-emerald-600 mt-4 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Strong Competency Match</span>
          </div>
        </div>
      </div>

      {/* Section 1 — Career Health Overview (KPI Cards) */}
      <KPICards
        resumeScore={activeAnalysis.score}
        atsScore={activeAnalysis.ats_score}
        jobMatchScore={analysisData?.job_match_score !== undefined ? analysisData.job_match_score : (activeAnalysis.job_match?.overall_match_score || null)}
        careerReadiness={snapshotProps.careerReadiness}
      />

      {/* Career Growth Overview Section */}
      {historyList.length >= 2 && (
        <div className="bg-gradient-to-r from-indigo-50/60 to-violet-50/60 border border-indigo-100/60 rounded-3xl p-5 shadow-soft space-y-4">
          <div className="flex justify-between items-center border-b border-indigo-100/30 pb-2">
            <div className="flex items-center gap-2 text-primary font-bold">
              <TrendingUp className="w-5 h-5 text-indigo-650" />
              <span className="text-xs font-extrabold text-slate-800">Career Growth Overview</span>
            </div>
            <Link href="/progress" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
              Open Progress Tracker <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-50 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resume Versions</span>
              <span className="text-base font-extrabold text-slate-800 mt-1">{historyList.length} Versions</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-50 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Improvements</span>
              <span className="text-base font-extrabold text-emerald-600 mt-1">+{
                (() => {
                  let improvementsCount = 0;
                  for (let i = 1; i < historyList.length; i++) {
                    if (historyList[i].ats_score > historyList[i - 1].ats_score) improvementsCount++;
                    if (historyList[i].overall_score > historyList[i - 1].overall_score) improvementsCount++;
                  }
                  return improvementsCount;
                })()
              } Scores</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-50 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Highest ATS Match</span>
              <span className="text-base font-extrabold text-slate-800 mt-1">{
                Math.max(...historyList.map(h => h.ats_score), activeAnalysis.score - 5)
              }/100</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-50 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Skill Growth</span>
              <span className="text-base font-extrabold text-indigo-650 mt-1">+{
                Math.max(0, historyList[historyList.length - 1].skills_snapshot.length - historyList[0].skills_snapshot.length)
              } Skills</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-50 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Projects Completed</span>
              <span className="text-base font-extrabold text-slate-800 mt-1">0 <span className="text-[8px] text-slate-400 font-bold tracking-tight">(Future Integration)</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Section 9 — Pilo AI Insights */}
      {!loading && (
        <PiloInsights
          score={activeAnalysis.score}
          missingSkills={activeAnalysis.missing_skills || []}
          targetRole={targetRole}
        />
      )}

      {/* Main Analytics Grid Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Core Charts & Competencies */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Section 2 & Section 3: Radar Chart & Skill Gap Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Career Radar */}
            <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex flex-col justify-between">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Radar className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">Competency Assessment</h3>
              </div>
              <div className="mt-4 flex-1">
                {loading ? <ChartSkeleton /> : (!hasApiKey ? renderEmptyState("Configure your AI Provider to begin.") : (!hasResume ? renderEmptyState("Upload your first resume.") : (!analysisData ? renderEmptyState("Analyze your resume after upload.") : <CareerRadar data={radarData} />)))}
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">Competency gaps</h3>
                </div>
                <Link href="/skills" className="text-[10px] font-bold text-primary hover:underline">
                  View Skill Map
                </Link>
              </div>
              <div className="mt-4 flex-1">
                {loading ? <ChartSkeleton /> : (!hasApiKey ? renderEmptyState("Configure your AI Provider to begin.") : (!hasResume ? renderEmptyState("Upload your first resume.") : (!analysisData ? renderEmptyState("Analyze your resume after upload.") : <SkillGapAnalysis skills={skillGaps} />)))}
              </div>
            </div>
          </div>

          {/* Section 4 — Keyword Analytics Donut Chart */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <PieChart className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">Keyword Analytics</h3>
            </div>
            {loading ? <ChartSkeleton /> : (!hasApiKey ? renderEmptyState("Configure your AI Provider to begin.") : (!hasResume ? renderEmptyState("Upload your first resume.") : (!analysisData ? renderEmptyState("Analyze your resume after upload.") : <KeywordAnalytics analytics={activeAnalysis.keyword_analytics} />)))}
          </div>

          {/* Section 5 — ATS Breakdown Progress Bars */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <AlignLeft className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">ATS Breakdown Metrics</h3>
            </div>
            {loading ? <ChartSkeleton /> : (!hasApiKey ? renderEmptyState("Configure your AI Provider to begin.") : (!hasResume ? renderEmptyState("Upload your first resume.") : (!analysisData ? renderEmptyState("Analyze your resume after upload.") : <ATSBreakdown metrics={atsBreakdownMetrics} />)))}
          </div>

          {/* Section 6 — Project Recommendation Distribution Charts */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">Project Analytics</h3>
              </div>
              <Link href="/projects" className="text-[10px] font-bold text-primary hover:underline">
                View Project Hub
              </Link>
            </div>
            {loading ? <ChartSkeleton /> : (!hasApiKey ? renderEmptyState("Configure your AI Provider to begin.") : (!hasResume ? renderEmptyState("Upload your first resume.") : (!analysisData ? renderEmptyState("Analyze your resume after upload.") : <ProjectAnalytics projects={activeAnalysis.recommended_projects || []} />)))}
          </div>

        </div>

        {/* Right Column (4 cols): Snapshots, Timelines & Feeds */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Section 10 — Career Snapshot */}
          <CareerSnapshot {...snapshotProps} />

          {/* Section 7 — Interactive Vertical Roadmap Timeline */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Route className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">Milestone Roadmap</h3>
            </div>
            {loading ? <ChartSkeleton /> : (!hasApiKey ? renderEmptyState("Configure your AI Provider to begin.") : (!hasResume ? renderEmptyState("Upload your first resume.") : (!profile?.targetRole || profile?.targetRole === "Not specified" ? renderEmptyState("Select a target career.") : (!analysisData ? renderEmptyState("Analyze your resume after upload.") : <InteractiveRoadmap steps={roadmapSteps} />))))}
          </div>

          {/* Section 8 — AI Agent activity monitor logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-soft space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">AI Agent Activity Feed</span>
              </div>
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            {/* Visual sequential activity flow */}
            <AgentActivityFeed logs={liveLogs} />
          </div>

          {/* Knowledge Base Status Widget */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4.5 h-4.5 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">Knowledge Base Status</h3>
            </div>
            
            <div className="space-y-3 text-xs text-slate-650">
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-400">Indexed Docs:</span>
                <span className="font-bold text-slate-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] text-primary">
                  {kbStatus.indexed_documents} Chunks
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-400">Embedding Model:</span>
                <span className="font-bold text-slate-700 text-[10px] truncate max-w-[140px]">{kbStatus.embedding_model}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-400">Vector Database:</span>
                <span className="font-bold text-slate-700">{kbStatus.vector_database}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Retrieval Status:</span>
                <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                  kbStatus.retrieval_status === "Ready" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {kbStatus.retrieval_status}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
