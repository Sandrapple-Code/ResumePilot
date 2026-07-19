import React from "react";
import { motion } from "framer-motion";

interface ATSMetric {
  name: string;
  score: number;
  color: string; // e.g. "bg-indigo-500", "bg-emerald-500", etc.
  explanation: string;
}

interface ATSBreakdownProps {
  metrics: ATSMetric[];
}

export const ATSBreakdown: React.FC<ATSBreakdownProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
      {metrics.map((metric, idx) => (
        <div key={metric.name} className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700">{metric.name}</span>
            <span className="text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-soft">
              {metric.score}/100
            </span>
          </div>

          {/* Animated Indicator Bar */}
          <div className="relative h-2 w-full bg-slate-200/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metric.score}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.05 }}
              className={`absolute top-0 left-0 h-full rounded-full ${metric.color}`}
            />
          </div>

          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            {metric.explanation}
          </p>
        </div>
      ))}
    </div>
  );
};
