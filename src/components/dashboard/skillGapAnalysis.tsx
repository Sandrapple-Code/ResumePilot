import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface SkillGap {
  name: string;
  current: number;
  target: number;
}

interface SkillGapProps {
  skills: SkillGap[];
}

export const SkillGapAnalysis: React.FC<SkillGapProps> = ({ skills }) => {
  // Calculate gaps and sort descending by gap size
  const analyzedSkills = skills
    .map((s) => ({
      ...s,
      gap: Math.max(0, s.target - s.current),
    }))
    .sort((a, b) => b.gap - a.gap);

  return (
    <div className="space-y-4 font-sans">
      {analyzedSkills.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No skill gaps detected. Excellent alignment!</p>
      ) : (
        <div className="space-y-3.5 max-h-[310px] overflow-y-auto pr-1 custom-scrollbar">
          {analyzedSkills.map((item, idx) => {
            const isCritical = item.gap >= 40;

            return (
              <div key={item.name} className="space-y-1.5 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    {isCritical && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-50 text-[9px] text-rose-600 font-bold border border-rose-100 rounded-md">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Critical Gap</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2.5 text-[10px] font-bold text-slate-450">
                    <span className="text-slate-400">Current: {item.current}%</span>
                    <span className="text-primary">Target: {item.target}%</span>
                    <span className={isCritical ? "text-rose-500 font-bold" : "text-amber-500"}>
                      Gap: {item.gap}%
                    </span>
                  </div>
                </div>

                {/* Progress bar stack */}
                <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  {/* Current score bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.current}%` }}
                    transition={{ duration: 1, delay: idx * 0.05 }}
                    className="absolute top-0 left-0 h-full bg-emerald-500 z-10 rounded-full"
                  />
                  {/* Target gap bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.target}%` }}
                    transition={{ duration: 1, delay: idx * 0.05 }}
                    className={`absolute top-0 left-0 h-full ${
                      isCritical ? "bg-rose-250 bg-rose-200" : "bg-amber-200"
                    } opacity-70 z-0 rounded-full`}
                    style={{ backgroundColor: isCritical ? "#FECDD3" : "#FDE68A" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
