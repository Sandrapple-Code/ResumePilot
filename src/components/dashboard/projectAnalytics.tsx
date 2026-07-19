import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Project {
  title: string;
  difficulty: string;
  duration: string;
  skills_learned: string[];
}

interface ProjectProps {
  projects: Project[];
}

const PIE_COLORS = ["#10B981", "#5B5FEF", "#EF4444"]; // Easy (Green), Medium (Theme Blue), Hard (Rose)
const BAR_COLOR = "#818CF8"; // Indigo Light

export const ProjectAnalytics: React.FC<ProjectProps> = ({ projects }) => {
  // 1. Calculate Difficulty counts
  const difficulties = { Easy: 0, Medium: 0, Hard: 0 };
  projects.forEach((p) => {
    const diff = p.difficulty || "Medium";
    const key = (diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase()) as "Easy" | "Medium" | "Hard";
    if (key in difficulties) {
      difficulties[key]++;
    } else {
      difficulties["Medium"]++;
    }
  });

  const difficultyData = [
    { name: "Easy", value: difficulties.Easy || 0 },
    { name: "Medium", value: difficulties.Medium || 0 },
    { name: "Hard", value: difficulties.Hard || 0 },
  ].filter((d) => d.value > 0);

  // 2. Calculate Skill frequency
  const skillCounts: Record<string, number> = {};
  projects.forEach((p) => {
    (p.skills_learned || []).forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const skillData = Object.entries(skillCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 technologies

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2 rounded-xl text-[10px] font-mono shadow-soft">
          <p className="font-bold">{payload[0].name}: {payload[0].value} projects</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2 rounded-xl text-[10px] font-mono shadow-soft">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p className="text-indigo-300">Recommended in {payload[0].value} projects</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
      {/* Left: Difficulty Pie */}
      <div className="bg-slate-50/40 border border-slate-200/50 rounded-2xl p-4 flex flex-col items-center">
        <h4 className="text-xs font-bold text-slate-700 mb-2 self-start">Project Difficulty Layout</h4>
        {difficultyData.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 italic">
            No projects recommended
          </div>
        ) : (
          <div className="w-full h-[140px] flex items-center justify-around">
            <div className="w-[120px] h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={45}
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-2">
              {difficultyData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Tech stack bar */}
      <div className="bg-slate-50/40 border border-slate-200/50 rounded-2xl p-4 flex flex-col">
        <h4 className="text-xs font-bold text-slate-700 mb-2">Top Recommended Stack</h4>
        {skillData.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 italic">
            No technology stats
          </div>
        ) : (
          <div className="w-full h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 8 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 8 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
