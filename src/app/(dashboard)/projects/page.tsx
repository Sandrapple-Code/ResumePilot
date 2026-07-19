"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, ExternalLink, Code, CheckCircle, Trophy, BookOpen, Video, HelpCircle, XCircle, AlertTriangle, UploadCloud } from "lucide-react";
import { Pilo } from "@/components/pilo";
import { loadAISettings } from "@/services/aiConfig";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { useATSAnalysis } from "@/hooks/useATSAnalysis";

type FilterId = "all" | "frontend" | "devops";

interface ResumeImpact {
  value_description: string;
  section_strengthened: string;
  ats_keywords: string[];
}

interface ProjectItem {
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  skills_learned: string[];
  stack: string[];
  resume_impact: ResumeImpact;
  learning_outcome: string;
  repo_link: string;
  docs_link: string;
  tutorial_link?: string;
  category?: "frontend" | "devops";
}

export default function ProjectRecommendations() {
  const { getIdToken, user, profile } = useAuth();
  const { currentResume, hasResume: contextHasResume, loading: resumeLoading } = useResume();
  const { atsContext, loading: atsLoading } = useATSAnalysis();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [hasResume, setHasResume] = useState(true);

  // Default Fallback Projects matching the enriched model
  const defaultProjects: ProjectItem[] = [
    {
      title: "React Component Testing Harness",
      category: "frontend",
      difficulty: "Medium",
      duration: "4 hours",
      description: "Configure Jest and React Testing Library inside a Next.js framework. Build mocks for REST hooks, test custom context state changes, and reach 90% code coverage metrics.",
      stack: ["React", "Jest", "Testing Library", "TypeScript"],
      skills_learned: ["Unit Testing", "Jest mock frameworks", "Code coverage optimization"],
      resume_impact: {
        value_description: "Recruiters value this project because it shows automated testing experience for large frontends, ensuring software delivery safety.",
        section_strengthened: "Technical Skills / Projects",
        ats_keywords: ["Jest", "React Testing Library", "Automated Testing", "Mocking APIs", "Code Coverage"]
      },
      learning_outcome: "After completing this project you will understand Jest configuration, React Testing Library rendering, mock server routing, and code coverage auditing.",
      repo_link: "https://github.com/vercel/next.js/tree/canary/examples/with-jest",
      docs_link: "https://testing-library.com/docs/react-testing-library/intro/",
      tutorial_link: "https://nextjs.org/docs/app/building-your-application/testing/jest"
    },
    {
      title: "Next.js & Tailwind CSS Responsive Dashboard",
      category: "frontend",
      difficulty: "Easy",
      duration: "3 hours",
      description: "Build a highly responsive, pixel-perfect dashboard using Next.js and Tailwind CSS. Implement dynamic charting, dark mode toggle, and optimized mobile-first grid layout.",
      stack: ["Next.js", "React", "Tailwind CSS", "Recharts"],
      skills_learned: ["Responsive Design", "Tailwind CSS layout grid", "Next.js routing", "Dynamic Charting"],
      resume_impact: {
        value_description: "Recruiters value this project because it showcases modern styling conventions, responsive layouts, and standard dashboard interaction models.",
        section_strengthened: "Technical Skills / Projects",
        ats_keywords: ["Tailwind CSS", "Next.js", "Responsive Layout", "CSS Grid", "MUI", "Recharts"]
      },
      learning_outcome: "After completing this project you will understand utility-first styling, grid layouts, responsive breakpoints, and charting integrations.",
      repo_link: "https://github.com/vercel/next.js/tree/canary/examples/with-tailwindcss",
      docs_link: "https://tailwindcss.com/docs",
      tutorial_link: "https://nextjs.org/docs"
    },
    {
      title: "Multi-Stage Docker React Build",
      category: "devops",
      difficulty: "Easy",
      duration: "2 hours",
      description: "Containerize a React/Next.js application using Docker. Configure a multi-stage Dockerfile containing a lightweight Alpine Node environment and an Nginx production server.",
      stack: ["Docker", "Nginx", "Alpine Linux", "React"],
      skills_learned: ["Containerization", "Multi-stage building", "Nginx server routing"],
      resume_impact: {
        value_description: "Recruiters value this project because it establishes core containerization and deployment pipelines for modern Single Page Applications (SPA).",
        section_strengthened: "DevOps / Production Experience",
        ats_keywords: ["Docker", "Nginx", "Containerization", "Multi-stage Build", "Alpine Linux"]
      },
      learning_outcome: "After completing this project you will understand Docker networking, container orchestration, image creation, Docker Compose, and production deployment.",
      repo_link: "https://github.com/vercel/next.js/tree/canary/examples/with-docker",
      docs_link: "https://docs.docker.com/",
      tutorial_link: "https://docs.docker.com/get-started/workshop/"
    },
    {
      title: "GitHub Actions CI/CD Pipeline Setup",
      category: "devops",
      difficulty: "Medium",
      duration: "3 hours",
      description: "Establish a complete Continuous Integration/Continuous Deployment flow. Automate linting, unit testing compliance checks, and Docker container compilation on repository commits.",
      stack: ["GitHub Actions", "Docker", "ESLint", "Node.js"],
      skills_learned: ["CI/CD Pipeline design", "Build automation", "Task runner setups"],
      resume_impact: {
        value_description: "Recruiters value this project because it demonstrates automation of verification and delivery flows, reducing release cycle times.",
        section_strengthened: "DevOps / Release Engineering",
        ats_keywords: ["GitHub Actions", "CI/CD Pipeline", "Build Automation", "Task Runners", "ESLint"]
      },
      learning_outcome: "After completing this project you will understand GitHub Actions YAML syntax, secrets configuration, continuous integration, and automated Docker repository deployments.",
      repo_link: "https://github.com/actions/starter-workflows",
      docs_link: "https://docs.github.com/en/actions",
      tutorial_link: "https://www.youtube.com/watch?v=2r15vV4eP1k"
    }
  ];

  useEffect(() => {
    if (!user) return;
    if (resumeLoading) return;
    if (!contextHasResume || !currentResume) {
      setHasResume(false);
      setProjects([]);
    } else {
      setHasResume(true);
    }

    const settings = loadAISettings(user.uid);
    setHasApiKey(!!settings.apiKey);
  }, [user, currentResume, contextHasResume, resumeLoading]);

  useEffect(() => {
    setLoading(atsLoading);
  }, [atsLoading]);

  useEffect(() => {
    if (atsContext) {
      const projectsList = atsContext.recommended_projects || [];
      if (projectsList.length > 0) {
        const items = projectsList.map((proj: any) => {
          const hasDevOps = proj.stack?.some((s: string) => 
            ["docker", "nginx", "github actions", "terraform", "aws", "kubernetes"].includes(s.toLowerCase())
          );
          return {
            ...proj,
            category: hasDevOps ? "devops" : "frontend"
          };
        });
        setProjects(items);
      } else {
        setProjects([]);
      }
    } else {
      setProjects([]);
    }
  }, [atsContext]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Hard": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  const filteredProjects = projects.filter(
    (p) => activeFilter === "all" || p.category === activeFilter
  );

  // 1. API key missing banner
  if (!hasApiKey && !loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">API Provider Configuration Required</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650">
            Configure your AI Provider to begin.
          </p>
          <Link
            href="/settings"
            className="inline-flex h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // 2. Resume missing CTA
  if (!hasResume && !loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <UploadCloud className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Resume Uploaded</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650">
            Upload your first resume.
          </p>
          <Link
            href="/upload"
            className="inline-flex h-10 px-5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  // 3. Projects empty list check
  if (projects.length === 0 && !loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-indigo-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Projects Generated</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-650">
            Analyze your resume after upload.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex h-10 px-5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl items-center justify-center transition-colors cursor-pointer"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Banner */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex gap-4 items-center flex-1">
          <Pilo state="pointing" size={80} className="flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Bridge Gaps with Starter Repositories</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
              Inspect any curated project blueprint below. Clone the official open-source template repository, review learning outcomes, and study the recruiter impact checklist to upgrade your resume value.
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 flex-shrink-0">
          {[
            { id: "all", name: "All Matches" },
            { id: "frontend", name: "Frontend Gaps" },
            { id: "devops", name: "DevOps Gaps" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFilter(f.id as FilterId);
                setSelectedProject(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === f.id
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Projects cards on left, drawer details on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Project Cards */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            // Skeleton Loading cards
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="w-16 h-5 bg-slate-150 rounded" />
                  <div className="w-12 h-4 bg-slate-150 rounded" />
                </div>
                <div className="w-3/4 h-5 bg-slate-150 rounded" />
                <div className="w-full h-10 bg-slate-100 rounded" />
                <div className="flex gap-2">
                  <div className="w-12 h-5 bg-slate-100 rounded" />
                  <div className="w-12 h-5 bg-slate-100 rounded" />
                </div>
              </div>
            ))
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((project, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedProject(project)}
                className={`bg-white border rounded-3xl p-6 shadow-soft hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer text-left ${
                  selectedProject?.title === project.title ? "border-primary ring-2 ring-primary/10" : "border-border/80"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border ${getDifficultyColor(project.difficulty)}`}>
                      {project.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{project.duration}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-800 hover:text-primary transition-colors">{project.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Tech badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.stack?.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-200/50 text-[10px] text-slate-500 font-semibold rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Skills Learned */}
                  <div className="space-y-2 pt-3 border-t border-slate-100/60">
                    <h5 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>SKILLS LEARNED</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {project.skills_learned?.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resume Impact */}
                  <div className="space-y-2 pt-3 border-t border-slate-100/60">
                    <h5 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-indigo-500" />
                      <span>RESUME IMPACT</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {project.resume_impact?.value_description}
                    </p>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      <span className="text-slate-400">Strengthens:</span> {project.resume_impact?.section_strengthened}
                    </div>
                    {/* ATS Keywords Checkmarks */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.resume_impact?.ats_keywords?.map((keyword) => (
                        <span key={keyword} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold">
                          ✔ {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Learning Outcome */}
                  <div className="space-y-2 pt-3 border-t border-slate-100/60">
                    <h5 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>LEARNING OUTCOME</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {project.learning_outcome}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 mt-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  {project.repo_link ? (
                    <a
                      href={project.repo_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl shadow-soft flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>📂 Open Starter Repository</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full h-9 bg-slate-100 text-slate-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/40"
                    >
                      <span>Repository Coming Soon</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {project.docs_link && (
                      <a
                        href={project.docs_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-xl shadow-soft flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>📖 Docs</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}

                    {project.tutorial_link ? (
                      <a
                        href={project.tutorial_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 bg-indigo-50 hover:bg-indigo-100 text-primary text-[11px] font-bold rounded-xl shadow-soft flex items-center justify-center gap-1 border border-indigo-100/40 transition-colors cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-primary" />
                        <span>🎥 Tutorial</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <div className="h-9 bg-slate-50 border border-slate-100 text-slate-350 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-default opacity-50">
                        <span>🎥 N/A</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white border border-border/80 rounded-3xl p-10 text-center text-slate-400 font-semibold">
              No recommendations available yet.
            </div>
          )}
        </div>

        {/* Right Side: Project Drawer / Detail Widget */}
        <div className="xl:col-span-4">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={selectedProject.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-border/80 rounded-3xl p-6 shadow-premium h-full flex flex-col justify-between min-h-[460px] text-left"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 rounded-md text-[9px] text-primary font-bold uppercase border border-indigo-100">
                      {selectedProject.category || "PROJECT"}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">{selectedProject.title}</h3>
                  </div>

                  {/* Skills lists */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>SKILLS TO EARN</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProject.skills_learned?.map((s) => (
                        <span key={s} className="px-2 py-1 bg-slate-50 border border-slate-200/50 rounded-lg text-xs font-semibold text-slate-650 text-slate-650 flex items-center gap-1 text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resume Impact Section */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-500" />
                      <span>RESUME IMPACT ANALYSIS</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {selectedProject.resume_impact?.value_description}
                    </p>
                    <div className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      <span className="text-slate-400">Strengthens:</span> {selectedProject.resume_impact?.section_strengthened}
                    </div>
                    {/* ATS Keywords Checkmarks */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">ATS Keywords Introduced:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedProject.resume_impact?.ats_keywords?.map((keyword) => (
                          <span key={keyword} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold">
                            ✔ {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Learning Outcome Section */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>LEARNING OUTCOME</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {selectedProject.learning_outcome}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3.5 mt-6">
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Starter repository button */}
                    {selectedProject.repo_link ? (
                      <a
                        href={selectedProject.repo_link}
                        target="_blank"
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-soft flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span>📂 Open Starter Repository</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full h-11 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200/40"
                      >
                        <span>Repository Coming Soon</span>
                      </button>
                    )}

                    {/* Official documentation button */}
                    {selectedProject.docs_link && (
                      <a
                        href={selectedProject.docs_link}
                        target="_blank"
                        className="w-full h-11 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-soft flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        <span>📖 View Documentation</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}

                    {/* Optional tutorial button */}
                    {selectedProject.tutorial_link && (
                      <a
                        href={selectedProject.tutorial_link}
                        target="_blank"
                        className="w-full h-11 bg-indigo-50 hover:bg-indigo-100 text-primary text-xs font-bold rounded-xl shadow-soft flex items-center justify-center gap-2 border border-indigo-100/40 transition-colors cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-primary" />
                        <span>🎥 Watch Tutorial</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft h-full flex flex-col items-center justify-center text-center py-16 my-auto min-h-[460px]">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-soft mb-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Project Action Blueprint</h4>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-[200px] mx-auto mt-1.5 leading-normal">
                    Click any card on the left to review skills gained, inspect recruiter impact checklists, and open starter repositories.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
