import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Award, Target, Briefcase, Activity } from "lucide-react";

interface KPIProps {
  resumeScore: number;
  atsScore: number;
  jobMatchScore: number | null;
  careerReadiness: number;
  prevResumeScore?: number;
  prevAtsScore?: number;
  prevJobMatchScore?: number;
  prevCareerReadiness?: number;
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad formula
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(easeProgress * (end - start) + start);
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
};

export const KPICards: React.FC<KPIProps> = ({
  resumeScore,
  atsScore,
  jobMatchScore,
  careerReadiness,
  prevResumeScore = 75,
  prevAtsScore = 70,
  prevJobMatchScore = 75,
  prevCareerReadiness = 73,
}) => {
  const kpis = [
    {
      title: "Resume Score",
      value: resumeScore,
      prev: prevResumeScore,
      icon: Award,
      suffix: "/100",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "ATS Compatibility",
      value: atsScore,
      prev: prevAtsScore,
      icon: Target,
      suffix: "%",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Job Match Index",
      value: jobMatchScore !== null ? jobMatchScore : null,
      prev: prevJobMatchScore,
      icon: Briefcase,
      suffix: "%",
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      title: "Career Readiness",
      value: careerReadiness,
      prev: prevCareerReadiness,
      icon: Activity,
      suffix: "%",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, idx) => {
        const hasValue = kpi.value !== null && kpi.value !== undefined && !isNaN(kpi.value);
        const diff = hasValue && kpi.value !== null && kpi.value !== undefined ? Math.round(kpi.value - kpi.prev) : 0;
        const trend = diff >= 0 ? "up" : "down";

        return (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft hover:shadow-premium transition-all duration-300 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {kpi.title}
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black text-slate-800 tracking-tighter">
                    {hasValue && kpi.value !== null ? <AnimatedNumber value={kpi.value} /> : "N/A"}
                  </span>
                  {hasValue && (
                    <span className="text-xs font-bold text-slate-400">{kpi.suffix}</span>
                  )}
                </div>
              </div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>

            {hasValue && diff !== 0 && (
              <div className="mt-4 flex items-center gap-1">
                <div
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                    trend === "up"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}
                >
                  {trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  <span>{Math.abs(diff)}%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">vs previous run</span>
              </div>
            )}

            {!hasValue && (
              <div className="mt-4 text-[10px] text-slate-400 font-semibold italic">
                Upload job description to activate
              </div>
            )}

            {/* Subtle glow background */}
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50 z-0 pointer-events-none" />
          </motion.div>
        );
      })}
    </div>
  );
};
