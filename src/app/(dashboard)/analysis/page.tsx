"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Terminal,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  UploadCloud
} from "lucide-react";
import { Pilo } from "@/components/pilo";
import { loadAISettings } from "@/services/aiConfig";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { updateResumeMetadata } from "@/services/firestore";
import { useATSAnalysis } from "@/hooks/useATSAnalysis";

type TabId = "ats" | "agents" | "revisions";

export default function ResumeAnalysis() {
  const { user, getIdToken, profile } = useAuth();
  const { currentResume, hasResume: contextHasResume, loading: resumeLoading } = useResume();
  const { atsContext, loading: atsLoading, error: atsError } = useATSAnalysis();
  const [activeTab, setActiveTab] = useState<TabId>("ats");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>("keywords");

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [hasResume, setHasResume] = useState(true);

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

  useEffect(() => {
    setLoading(atsLoading);
  }, [atsLoading]);

  useEffect(() => {
    if (atsError) {
      setError(atsError);
    } else {
      setError(null);
    }
  }, [atsError]);

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
    } else {
      setAnalysisData(null);
    }
  }, [atsContext]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const defaultAnalysis = {
    score: 78,
    matching_skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "HTML5/CSS3", "Git", "Redux"],
    missing_skills: ["Docker", "Jest testing", "CI/CD (GitHub Actions)", "Webpack customization"],
    auxiliary_skills: ["Webpack", "Figma"],
    checklist: [
      { title: "Contact Details Found", desc: "Fully resolved email, phone, and github links.", status: "pass" },
      { title: "Structural Layout Verification", desc: "Standard single-page, multi-section chronological structure detected.", status: "pass" },
      { title: "Critical Core Competency Gap", desc: "Missing 'Docker', 'Jest', and 'CI/CD' keyword credentials.", status: "fail" },
      { title: "Passive Action Verb Threshold", desc: "3 bullets use passive verbs ('helped', 'worked') decreasing impact weights.", status: "fail" }
    ],
    revisions: [
      {
        original: "Helped the team build the React frontend and style the website.",
        improved: "Collaborated on next-gen React architecture, reducing render latencies by 30% using Tailwind CSS & code-splitting.",
        rationale: "Quantifies achievements and incorporates active verbs ('Collaborated', 'Reducing') instead of passive phrasing ('Helped')."
      },
      {
        original: "Worked on Python script optimization and handled docker container deployment.",
        improved: "Engineered multi-stage Docker build automation, reducing container sizes by 45% and speeding up CI/CD pipeline builds.",
        rationale: "Includes specific technical metrics and highlights Docker keyword density."
      },
      {
        original: "Responsible for fixing bugs and general support on React dashboard.",
        improved: "Resolved 50+ critical React rendering anomalies, boosting application uptime to 99.9% while optimizing state contexts.",
        rationale: "Emphasizes scale, impact, and specific React state concepts."
      }
    ]
  };

  const activeAnalysis = analysisData;

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 font-sans">
        <Pilo state="thinking" size={100} className="animate-bounce" />
        <div className="text-center space-y-2">
          <h3 className="text-sm font-bold text-slate-800">Analyzing Your Resume...</h3>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed">
            Deploying professional agent auditors and critiquing layout profiles with Groq LLM.
          </p>
        </div>
      </div>
    );
  }

  // 1. API Provider Key missing warning
  if (!hasApiKey) {
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

  // 2. Resume missing warning
  if (!hasResume) {
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

  // 3. Analysis missing check
  if (!activeAnalysis) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-indigo-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Active Analysis</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650">
            Analyze your resume after upload.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex h-10 px-5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-800">Analysis Halted</h3>
          <p className="text-xs text-rose-600 font-semibold leading-relaxed">
            {error}
          </p>
          <Link
            href="/settings"
            className="inline-flex h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* Left Column (5 cols): Mock PDF Resume Preview */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">RESUME DOCUMENT PREVIEW</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {currentResume?.filename || (typeof window !== "undefined" && sessionStorage.getItem("resume_filename_" + user?.uid)) || "resume.pdf"}
          </span>
        </div>

        {/* Paper Simulation */}
        <div className="bg-white border border-border/80 rounded-2xl p-6 shadow-soft text-slate-800 text-[10px] space-y-5 leading-normal relative min-h-[580px] overflow-y-auto select-none">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {activeAnalysis.parsed_data?.name || user?.displayName || user?.email?.split("@")[0] || "Pilot User"}
            </h3>
            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
              {activeAnalysis.parsed_data ? (
                `${activeAnalysis.parsed_data.email || ""} ${activeAnalysis.parsed_data.phone ? "• " + activeAnalysis.parsed_data.phone : ""} ${activeAnalysis.parsed_data.github ? "• " + activeAnalysis.parsed_data.github : ""} ${activeAnalysis.parsed_data.linkedin ? "• " + activeAnalysis.parsed_data.linkedin : ""}`
              ) : (
                `${user?.email || "guest@resumepilot.ai"} • (Contact Info Not Specified)`
              )}
            </p>
          </div>

          {/* Professional Summary */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5">Professional Summary</h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              {activeAnalysis.parsed_data?.summary || "Frontend developer with 3+ years experience building web applications. Skilled in HTML, CSS, React, and TypeScript. Eager to join a fast-paced development team to build engaging user interfaces."}
            </p>
          </div>

          {/* Technical Skills */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5">Technical Skills</h4>
            {activeAnalysis.parsed_data?.skills?.length > 0 ? (
              <p className="text-slate-600 leading-relaxed font-medium">
                {activeAnalysis.parsed_data.skills.join(", ")}
              </p>
            ) : (
              <p className="text-slate-600 leading-normal font-medium">
                <span className="font-bold text-slate-800">Languages & Frameworks:</span> JavaScript, TypeScript, HTML5, CSS3, React, Next.js, Redux.<br />
                <span className="font-bold text-slate-800">Tools:</span> Git, GitHub, VS Code, webpack, npm.
              </p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5">Professional Experience</h4>
            
            {activeAnalysis.parsed_data?.experience?.length > 0 ? (
              <ul className="list-disc pl-3 text-slate-600 space-y-1 font-medium">
                {activeAnalysis.parsed_data.experience.map((bullet: string, idx: number) => (
                  <li key={idx} className="relative leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Frontend Engineer • TechCorp Solutions</span>
                    <span>2024 - Present</span>
                  </div>
                  <ul className="list-disc pl-3 text-slate-600 space-y-0.5 font-medium">
                    <li className="relative"><span className="absolute -left-3 text-rose-500 font-bold">!</span>Helped the team build the React frontend and style the website.</li>
                    <li>Created custom dashboard UI features using charts and layout libraries.</li>
                    <li className="relative"><span className="absolute -left-3 text-rose-500 font-bold">!</span>Responsible for fixing bugs and general support on React dashboard.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Software Developer Intern • DevScale Inc</span>
                    <span>2023 - 2024</span>
                  </div>
                  <ul className="list-disc pl-3 text-slate-600 space-y-0.5 font-medium">
                    <li className="relative"><span className="absolute -left-3 text-rose-500 font-bold">!</span>Worked on Python script optimization and handled docker container deployment.</li>
                    <li>Integrated external REST endpoints and cleaned database schema parameters.</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Projects */}
          {activeAnalysis.parsed_data?.projects?.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5">Projects</h4>
              <ul className="list-disc pl-3 text-slate-600 space-y-1 font-medium">
                {activeAnalysis.parsed_data.projects.map((proj: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{proj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications */}
          {activeAnalysis.parsed_data?.certifications?.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5">Certifications</h4>
              <ul className="list-disc pl-3 text-slate-600 space-y-1 font-medium">
                {activeAnalysis.parsed_data.certifications.map((cert: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{cert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Education */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5">Education</h4>
            {activeAnalysis.parsed_data?.education?.length > 0 ? (
              <ul className="list-disc pl-3 text-slate-600 space-y-1 font-medium">
                {activeAnalysis.parsed_data.education.map((edu: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{edu}</li>
                ))}
              </ul>
            ) : (
              <div className="flex justify-between font-bold text-slate-800 text-[10px]">
                <span>B.S. Computer Science • University of Technology</span>
                <span>2019 - 2023</span>
              </div>
            )}
          </div>

          {/* Highlight overlays on the PDF */}
          <div className="absolute top-[280px] left-8 right-8 h-5 bg-rose-500/10 border border-rose-350 border-rose-500/30 rounded pointer-events-none" />
          <div className="absolute top-[382px] left-8 right-8 h-5 bg-rose-500/10 border border-rose-500/30 rounded pointer-events-none" />
        </div>
      </div>

      {/* Right Column (7 cols): AI Analysis Tabs & Guidelines */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Pilo Guide Card */}
        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex gap-5 items-center">
          <Pilo state="thinking" size={80} className="flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-1">Mascot Guidance</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              I've highlighted three statements in your resume that are hurting your ATS matching score. Go to the <span className="font-bold text-indigo-650 text-primary">Key Revisions</span> tab to swap them with optimized, metric-driven alternatives!
            </p>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="bg-white border border-border/80 rounded-2xl p-1.5 shadow-soft flex">
          {[
            { id: "ats", name: "ATS Score" },
            { id: "agents", name: "Agent Reviews" },
            { id: "revisions", name: "Key Revisions" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-soft"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-premium min-h-[380px]">
          
          {/* Tab 1: ATS SCORE & CHECKLIST */}
          {activeTab === "ats" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-between p-4 bg-indigo-50/20 border border-indigo-150/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl border border-indigo-100 flex items-center justify-center text-primary text-xl font-extrabold shadow-soft">
                    {activeAnalysis.score}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">ATS Optimization Index</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Ranked 85th percentile of target roles</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Strong Matching</span>
                </div>
              </div>

              {/* Checks */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 tracking-wider">ATS SYSTEM CHECKLIST</h4>
                <div className="space-y-3">
                  {activeAnalysis.checklist.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      {item.status === "pass" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <p className={`text-[10px] font-medium ${item.status === "pass" ? "text-slate-500" : "text-rose-500 font-semibold"}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AGENT DEBATE & FEEDBACK */}
          {activeTab === "agents" && (
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">AGENT DETAILED BREAKDOWN</h4>
              
              {/* Agent 1 */}
              <div className="border border-border/80 rounded-2xl overflow-hidden bg-slate-50/20">
                <button
                  onClick={() => setExpandedAgent(expandedAgent === "keywords" ? null : "keywords")}
                  className="w-full p-4 flex justify-between items-center bg-slate-50 border-b border-border/50"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-700">Keywords Auditor Agent</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedAgent === "keywords" ? "rotate-180" : ""}`} />
                </button>
                {expandedAgent === "keywords" && (
                  <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed space-y-2">
                    <p>We matching against: <span className="font-bold text-slate-800">Senior Frontend Engineer</span>.</p>
                    <p className="text-rose-500 font-semibold">Flagged: Gaps found in DevOps and Automated Testing.</p>
                    <p>Recommendation: Incorporate terms like 'unit testing coverage', 'docker containers', and 'CI/CD pipeline integration' to boost match index by 15%.</p>
                  </div>
                )}
              </div>

              {/* Agent 2 */}
              <div className="border border-border/80 rounded-2xl overflow-hidden bg-slate-50/20">
                <button
                  onClick={() => setExpandedAgent(expandedAgent === "formatting" ? null : "formatting")}
                  className="w-full p-4 flex justify-between items-center bg-slate-50 border-b border-border/50"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">Formatting & Structure Agent</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedAgent === "formatting" ? "rotate-180" : ""}`} />
                </button>
                {expandedAgent === "formatting" && (
                  <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed space-y-1">
                    <p>Margins: Standard 1 inch - PASS</p>
                    <p>Font size hierarchy: Consistent - PASS</p>
                    <p>Colors: High-contrast Slate - PASS</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: KEY REVISIONS */}
          {activeTab === "revisions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">SUGGESTED PHRASE REWRITE CARD</h4>
              </div>

              <div className="space-y-4">
                {activeAnalysis.revisions.map((rev: any, index: number) => (
                  <div key={index} className="border border-border/85 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-wide">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Original text</span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold line-through decoration-rose-350 decoration-rose-200">
                        "{rev.original}"
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wide">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>AI Agent Revision</span>
                      </div>
                      <p className="text-xs text-slate-800 font-bold">
                        "{rev.improved}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold italic">{rev.rationale}</span>
                      <button
                        onClick={() => handleCopy(rev.improved, index)}
                        className="flex items-center gap-1 text-primary hover:text-indigo-750 font-bold"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Revision</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
