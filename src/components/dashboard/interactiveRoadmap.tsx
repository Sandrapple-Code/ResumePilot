import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, CheckCircle, Circle, PlayCircle } from "lucide-react";

interface RoadmapStep {
  step: number;
  topic: string;
  duration: string;
  description?: string;
  skills?: string[];
  projects?: string[];
  resources?: string[];
  status?: "completed" | "in-progress" | "not-started";
}

interface RoadmapProps {
  steps: RoadmapStep[];
}

export const InteractiveRoadmap: React.FC<RoadmapProps> = ({ steps }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-emerald-500 bg-white rounded-full flex-shrink-0" />;
      case "in-progress":
        return <PlayCircle className="w-5 h-5 text-amber-500 bg-white rounded-full flex-shrink-0 animate-pulse" />;
      case "not-started":
      default:
        return <Circle className="w-5 h-5 text-slate-300 bg-white rounded-full flex-shrink-0" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "in-progress":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "not-started":
      default:
        return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="relative pl-6 border-l-2 border-indigo-100/80 space-y-6 ml-3 py-2 font-sans select-none">
      {steps.map((item, idx) => {
        const isExpanded = expandedIndex === idx;
        
        // Mock detailed data if not present in input step
        const stepSkills = item.skills || [item.topic.split(" ").slice(-1)[0] || "General"];
        const stepProjects = item.projects || ["Target Practice Portfolio Lab"];
        const stepResources = item.resources || ["ResumePilot RAG Guidebooks", "Official Framework Documentation"];
        const stepStatus = item.status || (idx === 0 ? "in-progress" : "not-started");

        return (
          <div key={idx} className="relative">
            {/* Custom Node bullet anchor */}
            <div className="absolute -left-[32px] top-1">
              {getStatusIcon(stepStatus)}
            </div>

            <div className="bg-white border border-border/80 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden">
              {/* Header block (clickable) */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-primary bg-indigo-50 px-1.5 py-0.5 rounded">
                      Step {item.step || idx + 1}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">{item.duration}</span>
                    <span className={`inline-flex px-1.5 py-0.2 rounded border text-[8px] font-bold ${getStatusColor(stepStatus)}`}>
                      {stepStatus.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.topic}</h4>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details Panel */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-4 bg-slate-50/20 text-[11px] space-y-3.5">
                      <p className="text-slate-650 font-semibold leading-relaxed">
                        {item.description || "Synthesizing customized project roadmap steps with Groq agents based on core missing resume skills."}
                      </p>

                      {/* Skills to gain */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Required Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {stepSkills.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-primary rounded font-bold text-[9px] border border-indigo-100/50">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Projects to complete */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Associated Projects</span>
                        <ul className="list-disc list-inside text-slate-650 font-semibold space-y-0.5 pl-1">
                          {stepProjects.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Resources */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recommended Resources</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold pl-0.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{stepResources.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};
