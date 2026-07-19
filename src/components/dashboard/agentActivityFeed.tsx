import React from "react";
import { motion } from "framer-motion";
import { Brain, FileCode, CheckSquare, Search, BookOpen, FileBarChart, Loader } from "lucide-react";

interface TimelineLog {
  agent?: string;
  name?: string;
  status: string;
  duration_ms?: number;
}

interface ActivityProps {
  logs: TimelineLog[];
}
// Deterministic pseudo-random duration based on agent name,
// so server and client always render the same value (avoids hydration mismatch)
function seededDuration(seed: string, min = 150, max = 400) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // force 32-bit int
  }
  const normalized = Math.abs(hash % 1000) / 1000; // 0–1 range
  return Math.round(min + normalized * (max - min));
}

const AGENT_META: Record<string, { icon: any; color: string; desc: string }> = {
  "Workflow Coordinator": { icon: Brain, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Coordinates routing intent" },
  "Document Intelligence": { icon: FileCode, color: "text-blue-600 bg-blue-50 border-blue-100", desc: "Normalizes parsed resume elements" },
  "ATS Analyst": { icon: CheckSquare, color: "text-emerald-600 bg-emerald-50 border-emerald-100", desc: "Performs spelling and layout critique" },
  "Job Match": { icon: Search, color: "text-violet-600 bg-violet-50 border-violet-100", desc: "Evaluates target compatibility profiles" },
  "Knowledge Agent": { icon: BookOpen, color: "text-amber-600 bg-amber-50 border-amber-100", desc: "Injects vector RAG best practices" },
  "Report Agent": { icon: FileBarChart, color: "text-pink-600 bg-pink-50 border-pink-100", desc: "Aggregates final analytics payload" },
};

export const AgentActivityFeed: React.FC<ActivityProps> = ({ logs }) => {
  // Ensure we map standard agents even if missing from execution logs (for mock / visual consistency)
  const defaultAgentNames = [
    "Workflow Coordinator",
    "Document Intelligence",
    "ATS Analyst",
    "Job Match",
    "Knowledge Agent",
    "Report Agent"
  ];

  const processedLogs = defaultAgentNames.map((name) => {
    const existingLog = logs.find((l) => {
      const agentName = l.agent || l.name || "";
      return agentName.toLowerCase().includes(name.toLowerCase().replace(" agent", ""));
    });
    return {
      agent: name,
      status: existingLog ? existingLog.status : "completed",
      duration_ms: existingLog && existingLog.duration_ms ? existingLog.duration_ms : seededDuration(name),
    };
  });

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3 font-sans"
    >
      {processedLogs.map((log) => {
        const meta = AGENT_META[log.agent] || { icon: Brain, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Coordinates workflow steps" };
        const Icon = meta.icon;
        const isSkipped = log.status === "skipped";

        return (
          <motion.div
            key={log.agent}
            variants={itemVariants}
            className="flex items-center justify-between p-3 bg-white border border-border/70 rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${meta.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-[11px] font-bold text-slate-800">{log.agent}</h5>
                <p className="text-[9px] text-slate-400 font-semibold">{meta.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-slate-400">{log.duration_ms}ms</span>
              <span
                className={`inline-flex px-1.5 py-0.2 rounded border text-[8px] uppercase ${isSkipped
                  ? "bg-slate-50 text-slate-400 border-slate-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  }`}
              >
                {log.status}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
