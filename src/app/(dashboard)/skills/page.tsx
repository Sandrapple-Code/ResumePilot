"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, AlertTriangle, HelpCircle, ArrowRight, Award, Compass, HelpCircle as Help } from "lucide-react";
import { Pilo } from "@/components/pilo";

type RoleId = "frontend" | "fullstack" | "devops";

interface SkillItem {
  name: string;
  level: number; // 0-100
  status: "match" | "gap" | "auxiliary";
  category: string;
  description: string;
}

export default function SkillsPage() {
  const [selectedRole, setSelectedRole] = useState<RoleId>("frontend");
  const [hoveredSkill, setHoveredSkill] = useState<SkillItem | null>(null);

  const roleLabels = {
    frontend: "Senior Frontend Engineer",
    fullstack: "Senior Full-Stack Developer",
    devops: "Junior DevOps Engineer"
  };

  const mockSkills: Record<RoleId, SkillItem[]> = {
    frontend: [
      { name: "React", level: 95, status: "match", category: "Core Frontend", description: "Demonstrated across 3 project bullets. Strong component state lifecycle usage." },
      { name: "TypeScript", level: 85, status: "match", category: "Core Languages", description: "Configured generics and interface declarations on 2 job bullets." },
      { name: "Tailwind CSS", level: 90, status: "match", category: "Styling", description: "Applied responsive styling setups and utilities." },
      { name: "Next.js", level: 75, status: "match", category: "Core Frontend", description: "Utilized App Router layouts and server components." },
      { name: "Docker", level: 0, status: "gap", category: "DevOps", description: "Not found on resume. Target role listings request docker build containers." },
      { name: "Jest & RTL", level: 0, status: "gap", category: "Testing", description: "Not found on resume. Automated component unit testing is highly sought in listings." },
      { name: "CI/CD (Actions)", level: 0, status: "gap", category: "DevOps", description: "Not found on resume. 60% of senior listings require deployment pipelines." },
      { name: "Redux", level: 80, status: "match", category: "State Management", description: "Found state store configuration reference." },
      { name: "Webpack", level: 40, status: "auxiliary", category: "Bundlers", description: "Mentioned once, but lacks detail on configuration parameters." },
      { name: "Figma", level: 60, status: "auxiliary", category: "Design", description: "Secondary asset. Hand-off designs matching frontend components." }
    ],
    fullstack: [
      { name: "React", level: 95, status: "match", category: "Frontend", description: "Demonstrated across 3 project bullets." },
      { name: "Node.js (Express)", level: 60, status: "match", category: "Backend", description: "Configured API routers and backend endpoints." },
      { name: "PostgreSQL", level: 50, status: "match", category: "Database", description: "Written relational queries and schemas." },
      { name: "Python", level: 70, status: "match", category: "Languages", description: "Used for automation scripts and backend logic." },
      { name: "Docker", level: 0, status: "gap", category: "DevOps", description: "Not found. Crucial for full-stack environments to isolate DBs." },
      { name: "GraphQL", level: 0, status: "gap", category: "API", description: "Not found. Frequently requested in enterprise full-stack roles." },
      { name: "CI/CD (Actions)", level: 0, status: "gap", category: "DevOps", description: "Not found. Crucial for automated deployments." },
      { name: "TypeScript", level: 85, status: "match", category: "Languages", description: "Configured typing layers on frontend and backend." },
      { name: "Redis", level: 0, status: "gap", category: "Caching", description: "Not found on resume. Caching architectures are highly valuable." },
      { name: "Git", level: 90, status: "match", category: "Tools", description: "Fully integrated in codebase tracking." }
    ],
    devops: [
      { name: "Docker", level: 0, status: "gap", category: "Containers", description: "Not found. Fundamental building block for DevOps." },
      { name: "Kubernetes", level: 0, status: "gap", category: "Orchestration", description: "Not found. Required in 85% of DevOps roles." },
      { name: "Git & GitHub", level: 90, status: "match", category: "Tools", description: "Demonstrated standard version control usage." },
      { name: "Python", level: 70, status: "match", category: "Languages", description: "Used in script automation." },
      { name: "Bash Scripting", level: 50, status: "match", category: "Languages", description: "Used in standard task automation." },
      { name: "AWS", level: 0, status: "gap", category: "Cloud Providers", description: "Not found. Standard target platform for deployments." },
      { name: "Terraform", level: 0, status: "gap", category: "IaC", description: "Not found. Infrastructure as Code is crucial." },
      { name: "Linux Administration", level: 40, status: "auxiliary", category: "Operating Systems", description: "Secondary capability mentioned in summary." }
    ]
  };

  const getSkillsByStatus = (status: "match" | "gap" | "auxiliary") => {
    return mockSkills[selectedRole].filter((s) => s.status === status);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Role Selection Bar */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">TARGET COMPETENCY BENCHMARK</span>
          <h2 className="text-sm font-bold text-slate-800 mt-1">Comparing Resume Against Live Market Targets</h2>
        </div>

        {/* Role Toggles */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50">
          {(Object.keys(roleLabels) as RoleId[]).map((role) => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role);
                setHoveredSkill(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRole === role
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {roleLabels[role].split(" ")[1] || roleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left (Skills lists), Right (Interactive Details Sidebar) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side (8 columns): Lists of match, gap, auxiliary */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Matches Panel */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Matching Competencies ({getSkillsByStatus("match").length})</h3>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {getSkillsByStatus("match").map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => setHoveredSkill(skill)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 group ${
                    hoveredSkill?.name === skill.name
                      ? "bg-emerald-50 border-emerald-350 text-emerald-700"
                      : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-110 transition-transform" />
                  <span>{skill.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gaps Panel */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="w-5 h-5 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Missing Core Skills ({getSkillsByStatus("gap").length})</h3>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {getSkillsByStatus("gap").map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => setHoveredSkill(skill)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 group ${
                    hoveredSkill?.name === skill.name
                      ? "bg-rose-50 border-rose-350 text-rose-700"
                      : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 group-hover:scale-110 transition-transform animate-pulse" />
                  <span>{skill.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auxiliary Panel */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Help className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Auxiliary / Optional Skills ({getSkillsByStatus("auxiliary").length})</h3>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {getSkillsByStatus("auxiliary").map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => setHoveredSkill(skill)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 group ${
                    hoveredSkill?.name === skill.name
                      ? "bg-slate-100 border-slate-300 text-slate-700"
                      : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{skill.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side (4 columns): Interactive Detail Window & Pilo */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Skill Details card */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex-1 flex flex-col justify-between min-h-[300px]">
            <AnimatePresence mode="wait">
              {hoveredSkill ? (
                <motion.div
                  key={hoveredSkill.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-indigo-50 rounded-md text-[9px] text-primary font-bold uppercase border border-indigo-100">
                        {hoveredSkill.category}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        hoveredSkill.status === "match" ? "text-emerald-600" : hoveredSkill.status === "gap" ? "text-rose-500" : "text-slate-400"
                      }`}>
                        {hoveredSkill.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">{hoveredSkill.name}</h4>
                      {hoveredSkill.status === "match" && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[120px]">
                            <div className="bg-emerald-500 h-full" style={{ width: `${hoveredSkill.level}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">{hoveredSkill.level}% Match Weight</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {hoveredSkill.description}
                    </p>
                  </div>

                  {hoveredSkill.status === "gap" && (
                    <div className="pt-4 border-t border-slate-100 flex-shrink-0">
                      <Link href="/projects" className="w-full h-10 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft flex items-center justify-center gap-1.5 transition-colors">
                        <span>Bridge Gap in Project Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 my-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-soft">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Audit Skill Specifications</h4>
                    <p className="text-[10px] text-slate-400 font-semibold max-w-[180px] mx-auto mt-1 leading-normal">
                      Click any skill tag on the left to inspect resume credentials, level analysis, or bridge suggestions.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Guide Pilo */}
          <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex gap-4 items-center">
            <Pilo
              state="thinking"
              bubbleText={
                hoveredSkill?.status === "gap"
                  ? `Ah! ${hoveredSkill.name} is missing. Let's fix it by building a project!`
                  : `Reviewing ${roleLabels[selectedRole]} list!`
              }
              bubblePosition="top"
              size={70}
              className="flex-shrink-0"
            />
            <div className="text-[10px] text-slate-500 font-medium leading-normal flex-1">
              Selecting <span className="font-bold text-slate-700">{roleLabels[selectedRole]}</span> loads market keywords. Click tags to see what I suggest.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
