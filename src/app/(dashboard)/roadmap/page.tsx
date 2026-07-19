"use client";

import React, { useState, useEffect } from "react";
import { Map, CheckCircle2, Lock, UploadCloud, AlertTriangle, Bookmark } from "lucide-react";
import { Pilo } from "@/components/pilo";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { loadAISettings } from "@/services/aiConfig";
import { useATSAnalysis } from "@/hooks/useATSAnalysis";
import Link from "next/link";

interface Milestone {
  id: number;
  title: string;
  salaryRange: string;
  status: "completed" | "current" | "locked";
  desc: string;
  requirements: string[];
}

export default function CareerRoadmap() {
  const { user, getIdToken, profile } = useAuth();
  const { currentResume, hasResume: contextHasResume, loading: resumeLoading } = useResume();
  const { atsContext, loading: atsLoading } = useATSAnalysis();
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(1);

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
    if (atsContext) {
      setAnalysisData(atsContext);
    } else {
      setAnalysisData(null);
    }
  }, [atsContext]);

  const milestones: Milestone[] = analysisData?.learning_roadmap ? analysisData.learning_roadmap.map((s: any, idx: number) => ({
    id: s.step || idx + 1,
    title: s.topic,
    salaryRange: "Standard Comp",
    status: s.status || (idx === 0 ? "current" : "locked"),
    desc: s.details ? s.details.join(" ") : `Master target skills related to ${s.topic}.`,
    requirements: s.details || []
  })) : [];

  useEffect(() => {
    if (milestones.length > 0) {
      const currentMilestone = milestones.find(m => m.status === "current");
      if (currentMilestone) {
        setSelectedMilestone(currentMilestone.id);
      } else {
        setSelectedMilestone(milestones[0].id);
      }
    }
  }, [analysisData]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-6 font-sans">
        <Pilo state="thinking" size={100} className="animate-bounce" />
        <div className="text-center space-y-2">
          <h3 className="text-sm font-bold text-slate-800">Loading Career Roadmap...</h3>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed">
            Retrieving milestones and tracking skill paths...
          </p>
        </div>
      </div>
    );
  }

  // 1. API Key Check Empty State
  if (!hasApiKey) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">API Provider Configuration Required</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
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

  // 2. Resume Check Empty State
  if (!hasResume) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <UploadCloud className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Resume Uploaded</h3>
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

  // 3. Target Career Check Empty State
  if (!profile?.targetRole || profile?.targetRole === "Not specified") {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <Map className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Target Career Selected</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
            Select a target career.
          </p>
          <Link
            href="/career-goal"
            className="inline-flex h-10 px-5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Select Target Role
          </Link>
        </div>
      </div>
    );
  }

  // 4. Analysis Check Empty State
  if (milestones.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-indigo-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Career Analysis Found</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
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

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col sm:flex-row items-center gap-6">
        <Pilo
          state="thinking"
          bubbleText={`Here's your career trajectory, pilot. Focus on Stage: ${milestones.find(m => m.status === "current")?.title || "Upcoming Skills"}. Bridging your skill gaps will unlock next milestones!`}
          bubblePosition="right"
          size={85}
        />
      </div>

      {/* Main Grid: Left Timeline, Right Milestone Detailed Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left (8 columns): Timeline Timeline */}
        <div className="xl:col-span-8 bg-white border border-border/80 rounded-3xl p-6 md:p-8 shadow-soft">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-8">
            <Map className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Flight Path Milestones</h3>
          </div>

          {/* Timeline track container */}
          <div className="relative pl-6 md:pl-10 space-y-12">
            {/* Timeline vertical bar */}
            <div className="absolute left-[31px] md:left-[47px] top-3 bottom-3 w-0.5 bg-slate-100" />

            {milestones.map((m) => {
              const isSelected = selectedMilestone === m.id;
              
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestone(m.id)}
                  className={`relative flex flex-col md:flex-row md:items-center gap-6 group cursor-pointer transition-all ${
                    isSelected ? "scale-[1.01]" : "hover:scale-[1.005]"
                  }`}
                >
                  {/* Circle Indicator on vertical track */}
                  <div className="absolute -left-[30px] md:-left-[42px] top-1 z-10 flex items-center justify-center">
                    {m.status === "completed" ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-soft">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : m.status === "current" ? (
                      <div className="w-5 h-5 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-white shadow-soft animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-400">
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Milestone Brief Summary Card */}
                  <div className={`flex-1 p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-indigo-50/20 border-primary shadow-soft"
                      : "bg-slate-50/30 border-border/80 hover:border-slate-350"
                  }`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className={`text-xs font-bold ${isSelected ? "text-primary" : "text-slate-800"}`}>
                        {m.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100/80 px-2 py-0.5 rounded">
                        {m.salaryRange}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (4 columns): Milestone Details Card */}
        <div className="xl:col-span-4">
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-premium h-full flex flex-col justify-between min-h-[460px]">
            {(() => {
              const activeNode = milestones.find((m) => m.id === selectedMilestone);
              if (!activeNode) return null;

              return (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        activeNode.status === "completed"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : activeNode.status === "current"
                          ? "bg-indigo-50 text-primary border-indigo-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {activeNode.status.toUpperCase()} STAGE
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">{activeNode.title}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Compensation Tier: {activeNode.salaryRange}</p>
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{activeNode.desc}</p>

                    {/* Requirements list */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 tracking-wider">COMPETENCY SYLLABUS</h4>
                      <ul className="space-y-2">
                        {activeNode.requirements.map((req) => (
                          <li key={req} className="flex items-start gap-2 text-xs font-semibold text-slate-600 leading-normal">
                            <Bookmark className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
