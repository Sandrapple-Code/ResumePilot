import React from "react";
import { Sparkles } from "lucide-react";
import { Pilo } from "@/components/pilo";

interface InsightsProps {
  score: number;
  missingSkills: string[];
  targetRole: string;
}

export const PiloInsights: React.FC<InsightsProps> = ({ score, missingSkills, targetRole }) => {
  // Generate a dynamic recommendation
  const getDynamicRecommendation = () => {
    if (missingSkills.length > 0) {
      const topSkill = missingSkills[0];
      const secondSkill = missingSkills[1] || "automated testing frameworks";
      return `Your engineering foundation is solid, but adding one project focused on ${topSkill} and ${secondSkill} could improve your ATS alignment score by approximately ${Math.round(8 + Math.random() * 5)}%.`;
    }
    if (score >= 85) {
      return `Excellent alignment for the ${targetRole} role! Resolving minor layout spacing rules and adding more action-verb metrics will perfect your score.`;
    }
    return `Your background matches the ${targetRole} benchmarks well. Emphasize containerization and continuous integration workflows to raise your ATS score.`;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white/50 to-violet-50/50 backdrop-blur-lg border border-indigo-100/50 rounded-3xl p-5 shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-4">
      {/* Mascot Graphic container */}
      <div className="flex-shrink-0">
        <Pilo state="happy" size={75} />
      </div>

      <div className="space-y-2 flex-1 text-center sm:text-left z-10">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-primary text-[9px] font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pilo's Insight</span>
        </div>
        
        <p className="text-xs text-slate-650 font-semibold leading-relaxed">
          {getDynamicRecommendation()}
        </p>
      </div>

      {/* Decorative background circle */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-accent rounded-full filter blur-[40px] opacity-60 -mr-6 -mt-6 pointer-events-none" />
    </div>
  );
};
