import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDown, ChevronUp, Check, X, AlertTriangle, HelpCircle, Sparkles, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface KeywordAnalyticsItem {
  matched: string[];
  missing: string[];
  duplicate: Record<string, number>;
  unused: string[];
  coverage_percentage: number;
  matched_count: number;
  missing_count: number;
  duplicate_count: number;
  unused_count: number;
}

interface KeywordProps {
  analytics?: KeywordAnalyticsItem;
}

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#64748B"]; // Emerald, Rose, Amber, Slate

const REPLACEMENT_SUGGESTIONS: Record<string, string> = {
  "Adobe Flash": "HTML5 Canvas / WebGL",
  "MS Paint": "Figma / Canva",
  "Dreamweaver": "VS Code / Tailwind CSS",
  "FrontPage": "Next.js / React",
  "Silverlight": "React / WebAssembly",
  "ColdFusion": "Node.js / FastAPI",
  "jQuery": "Modern JavaScript (ES6+) / React",
  "Photoshop": "Figma (for UI design)",
  "Adobe Photoshop": "Figma (for UI design)"
};

// Default high-fidelity fallback if backend or parents don't provide analytics
const DEFAULT_ANALYTICS: KeywordAnalyticsItem = {
  matched: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Git", "Redux"],
  missing: ["Jest", "CI/CD", "Docker", "Webpack"],
  duplicate: { "React": 5, "TypeScript": 3 },
  unused: ["MS Paint", "Dreamweaver"],
  coverage_percentage: 60.0,
  matched_count: 6,
  missing_count: 4,
  duplicate_count: 2,
  unused_count: 2
};

export const KeywordAnalytics: React.FC<KeywordProps> = ({ analytics }) => {
  const { getIdToken } = useAuth();
  const active = analytics || DEFAULT_ANALYTICS;
  const [openSection, setOpenSection] = useState<string | null>("missing");
  const [history, setHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Fetch history for keyword trends comparison
  useEffect(() => {
    setMounted(true);
    const fetchHistory = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/history", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setHistory(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch history for keyword trends", err);
      }
    };
    fetchHistory();
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[280px] bg-slate-50/50 animate-pulse rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
        <span className="text-[10px] font-bold text-slate-405 text-slate-400">Loading Keyword Analytics...</span>
      </div>
    );
  }

  const chartData = [
    { name: "Matched Keywords", value: active.matched_count, color: COLORS[0] },
    { name: "Missing Keywords", value: active.missing_count, color: COLORS[1] },
    { name: "Duplicate Keywords", value: active.duplicate_count, color: COLORS[2] },
    { name: "Unused Keywords", value: active.unused_count, color: COLORS[3] }
  ];

  const total = chartData.reduce((sum, current) => sum + current.value, 0);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const CustomTooltip = ({ active: isTooltipActive, payload }: any) => {
    if (isTooltipActive && payload && payload.length) {
      const item = payload[0].payload;
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono shadow-soft">
          <p className="font-bold">{item.name}</p>
          <p className="text-indigo-300">
            Count: {item.value} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">

      {/* Upper Grid: Donut Chart & Legend + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

        {/* Recharts Donut */}
        <div className="md:col-span-5 h-[200px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tighter">
              {active.coverage_percentage}%
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">ATS Coverage</span>
          </div>
        </div>

        {/* Legend Cards */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3.5">
          {chartData.map((item) => (
            <div key={item.name} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{item.name}</p>
                <p className="text-xs font-extrabold text-slate-800">{item.value} Keywords</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Middle Grid: Expandable Interactive Sections */}
      <div className="space-y-2.5 border border-slate-150 rounded-2xl p-4 bg-slate-50/20">
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Detailed Keyword Breakdowns</h4>

        {/* Matched Section */}
        <div className="border border-slate-100 bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("matched")}
            className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-extrabold">✓</span>
              <span className="text-xs font-bold text-slate-700">Matched Keywords ({active.matched.length})</span>
            </div>
            {openSection === "matched" ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
          </button>

          {openSection === "matched" && (
            <div className="p-3.5 pt-0 border-t border-slate-50 flex flex-wrap gap-2 animate-fade-in">
              {active.matched.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-650 text-[10px] font-bold rounded-lg border border-emerald-100">
                  <Check className="w-3 h-3 text-emerald-500" />
                  {kw}
                </span>
              ))}
              {active.matched.length === 0 && <p className="text-[10px] text-slate-400">No matching keywords found.</p>}
            </div>
          )}
        </div>

        {/* Missing Section */}
        <div className="border border-slate-100 bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("missing")}
            className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-rose-50 text-rose-650 flex items-center justify-center text-[10px] font-extrabold">✗</span>
              <span className="text-xs font-bold text-slate-700">Missing Keywords ({active.missing.length})</span>
            </div>
            {openSection === "missing" ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
          </button>

          {openSection === "missing" && (
            <div className="p-3.5 pt-0 border-t border-slate-50 flex flex-wrap gap-2">
              {active.missing.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-650 text-[10px] font-bold rounded-lg border border-rose-100">
                  <X className="w-3 h-3 text-rose-500" />
                  {kw}
                </span>
              ))}
              {active.missing.length === 0 && <p className="text-[10px] text-slate-400">No missing keywords! You have complete coverage.</p>}
            </div>
          )}
        </div>

        {/* Duplicates Section */}
        <div className="border border-slate-100 bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("duplicate")}
            className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-[10px] font-extrabold">!</span>
              <span className="text-xs font-bold text-slate-700">Duplicate Keywords ({Object.keys(active.duplicate).length})</span>
            </div>
            {openSection === "duplicate" ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
          </button>

          {openSection === "duplicate" && (
            <div className="p-3.5 pt-0 border-t border-slate-50 space-y-2">
              <div className="flex flex-wrap gap-2">
                {Object.entries(active.duplicate).map(([kw, count]) => (
                  <span key={kw} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    {kw} <span className="text-amber-500 font-extrabold">×{count}</span>
                  </span>
                ))}
              </div>
              {Object.keys(active.duplicate).length > 0 ? (
                <p className="text-[9px] font-semibold text-amber-650 bg-amber-50/50 p-2 rounded-lg leading-relaxed">
                  💡 Recommendation: Reduce keyword density for heavily repeated terms. Repeating terms more than 3 times can sometimes trigger ATS spam/stuffing flags. Describe outcomes instead.
                </p>
              ) : (
                <p className="text-[10px] text-slate-400">No keyword stuffing or duplicates detected.</p>
              )}
            </div>
          )}
        </div>

        {/* Unused Section */}
        <div className="border border-slate-100 bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("unused")}
            className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-extrabold">?</span>
              <span className="text-xs font-bold text-slate-700">Unused or Outdated Skills ({active.unused.length})</span>
            </div>
            {openSection === "unused" ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
          </button>

          {openSection === "unused" && (
            <div className="p-3.5 pt-0 border-t border-slate-50 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {active.unused.map(kw => (
                  <div key={kw} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-[10px]">
                    <div>
                      <span className="font-bold text-slate-650">{kw}</span>
                      <p className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">Outdated Technology</p>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                      Replace with: {REPLACEMENT_SUGGESTIONS[kw] || "Modern Stack Alternatives"}
                    </span>
                  </div>
                ))}
              </div>
              {active.unused.length === 0 && <p className="text-[10px] text-slate-400">All listed resume skills align cleanly with modern target stack guidelines.</p>}
            </div>
          )}
        </div>

      </div>

      {/* Lower Section: Keyword Trends Compare */}
      {history.length >= 2 && (
        <div className="bg-white border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h4 className="text-xs font-bold text-slate-800 tracking-tight">Keyword Evolution History</h4>
          </div>

          <div className="space-y-3">
            {history.slice(-3).map((item, idx) => (
              <div key={`${item.upload_id}-${item.version}`} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-[9px] font-extrabold text-primary rounded">V{item.version}</span>
                  <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]" title={item.filename}>{item.filename}</span>
                </div>

                <div className="flex-1 flex flex-wrap gap-1 px-4">
                  {item.skills_snapshot.slice(0, 5).map((skill: string) => (
                    <span key={skill} className="px-1.5 py-0.5 bg-white border border-slate-100 rounded text-[9px] text-slate-500 font-semibold">{skill}</span>
                  ))}
                  {item.skills_snapshot.length > 5 && <span className="text-[8px] text-slate-400 font-bold self-center">+{item.skills_snapshot.length - 5} more</span>}
                </div>

                <div className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50/60 px-2 py-1 rounded-lg">
                  ATS: {item.ats_score}/100
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
