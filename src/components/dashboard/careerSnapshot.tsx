import React from "react";
import { Compass, Target, Calendar, Clock, BookOpen, ChevronRight, Edit2 } from "lucide-react";
import Link from "next/link";

interface SnapshotProps {
  targetRole: string;
  careerReadiness: number;
  nextSkill: string;
  remainingSkills: string[];
  timeline: string;
  studyHours: string;
}

export const CareerSnapshot: React.FC<SnapshotProps> = ({
  targetRole,
  careerReadiness,
  nextSkill,
  remainingSkills,
  timeline,
  studyHours,
}) => {
  return (
    <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-5 font-sans relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4.5 h-4.5 text-primary" />
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">Career Goal Intelligence</h3>
        </div>
        <Link 
          href="/career-goal" 
          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
          title="Edit Career Goal"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Goal Details & Readiness Gauge */}
      <div className="flex items-center gap-4 bg-slate-50/55 border border-slate-100/50 rounded-2xl p-4">
        <div className="flex-1 space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Pathway</span>
          <h4 className="text-sm font-extrabold text-slate-800 tracking-tight line-clamp-1">{targetRole}</h4>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Target: {timeline}</span>
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-full border border-slate-100 shadow-sm flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="10" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#4F46E5"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * careerReadiness) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xs font-black text-slate-800">{careerReadiness}%</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase leading-none">Ready</span>
          </div>
        </div>
      </div>

      {/* Key Gaps & Next Steps */}
      <div className="space-y-3">
        {/* Next Skill to Learn */}
        <div className="flex items-start justify-between text-xs py-1 border-b border-slate-50">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Next Target Skill</span>
          </div>
          <span className="font-bold text-indigo-650 bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded-lg text-[10px]">
            {nextSkill || "Core Engineering"}
          </span>
        </div>

        {/* Commitment Hours */}
        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Weekly Study Focus</span>
          </div>
          <span className="font-bold text-slate-700">{studyHours} Hours / Week</span>
        </div>

        {/* Remaining Skills List */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Skill Gaps</span>
          <div className="flex flex-wrap gap-1">
            {remainingSkills.length > 0 ? (
              remainingSkills.slice(0, 3).map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200/40 text-slate-650 font-bold rounded-md text-[9px] truncate max-w-[110px]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-400 font-semibold">No critical gaps! Fully matched.</span>
            )}
            {remainingSkills.length > 3 && (
              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-450 font-bold rounded-md text-[9px]">
                +{remainingSkills.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <Link 
        href="/career-goal" 
        className="w-full flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-150 border border-slate-200/60 hover:border-slate-300 text-slate-700 text-[10px] font-extrabold rounded-xl shadow-soft transition-all"
      >
        <span>Adjust Career Preferences</span>
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
};
