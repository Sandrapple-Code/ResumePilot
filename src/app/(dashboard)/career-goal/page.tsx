"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, Briefcase, Clock, Calendar, ArrowRight, ArrowLeft, 
  Check, Sparkles, AlertCircle, Laptop, Shield, Database, 
  Smartphone, Cpu, BarChart2, Layers, Paintbrush, Link2, Gamepad2
} from "lucide-react";
import { Pilo } from "@/components/pilo";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { syncUserProfile, updateResumeMetadata } from "@/services/firestore";
import { loadAISettings } from "@/services/aiConfig";

interface CareerOption {
  id: string;
  name: string;
  icon: any;
  desc: string;
}

const CAREER_OPTIONS: CareerOption[] = [
  { id: "AI/ML Engineer", name: "AI/ML Engineer", icon: Cpu, desc: "Design neural networks and train deep learning models" },
  { id: "Data Scientist", name: "Data Scientist", icon: BarChart2, desc: "Extract insights from big data and construct models" },
  { id: "Full Stack Developer", name: "Full Stack Developer", icon: Layers, desc: "Build client-facing frontends and server backends" },
  { id: "Frontend Developer", name: "Frontend Developer", icon: Laptop, desc: "Create modern responsive user interfaces and websites" },
  { id: "Backend Developer", name: "Backend Developer", icon: Database, desc: "Architect robust APIs, servers, and database schemas" },
  { id: "DevOps Engineer", name: "DevOps Engineer", icon: Shield, desc: "Automate CI/CD pipelines, containerize, and monitor infrastructure" },
  { id: "Cloud Engineer", name: "Cloud Engineer", icon: Compass, desc: "Configure cloud systems and deploy serverless architectures" },
  { id: "Mobile App Developer", name: "Mobile App Developer", icon: Smartphone, desc: "Develop native and cross-platform apps for iOS/Android" },
  { id: "Cybersecurity Engineer", name: "Cybersecurity Engineer", icon: Shield, desc: "Audit networks, protect data assets, and prevent threats" },
  { id: "Product Manager", name: "Product Manager", icon: Briefcase, desc: "Drive product strategy, design specs, and manage lifecycles" },
  { id: "UI/UX Designer", name: "UI/UX Designer", icon: Paintbrush, desc: "Design user experiences, mockups, and wireframe journeys" },
  { id: "Blockchain Developer", name: "Blockchain Developer", icon: Link2, desc: "Build smart contracts and distributed ledger solutions" },
  { id: "Game Developer", name: "Game Developer", icon: Gamepad2, desc: "Program game mechanics, graphics, and interactive assets" }
];

export default function CareerGoalWizard() {
  const { user, profile, updateProfileState, refreshProfile } = useAuth();
  const { refreshResume, currentResume } = useResume();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [targetTimeline, setTargetTimeline] = useState("");

  // Sync existing profile values if they exist
  useEffect(() => {
    if (profile) {
      if (profile.targetRole && profile.targetRole !== "Not specified") {
        const standardExists = CAREER_OPTIONS.some(o => o.id === profile.targetRole);
        if (standardExists) {
          setSelectedRole(profile.targetRole);
        } else {
          setSelectedRole("Other");
          setCustomRole(profile.targetRole);
        }
      }
      if (profile.experienceLevel) setExperienceLevel(profile.experienceLevel);
      if (profile.studyHoursPerWeek) setStudyHours(profile.studyHoursPerWeek);
      if (profile.targetTimeline) setTargetTimeline(profile.targetTimeline);
    }
  }, [profile]);

  const handleNext = () => {
    setError(null);
    if (step === 1 && !selectedRole) {
      setError("Please select a target role to proceed.");
      return;
    }
    if (step === 1 && selectedRole === "Other" && !customRole.trim()) {
      setError("Please enter your custom target role.");
      return;
    }
    if (step === 2 && !experienceLevel) {
      setError("Please select your current experience level.");
      return;
    }
    if (step === 3 && !studyHours) {
      setError("Please select your weekly study hours.");
      return;
    }
    if (step === 4) {
      handleSubmit();
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!targetTimeline) {
      setError("Please select your target timeline.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const finalRole = selectedRole === "Other" ? customRole.trim() : selectedRole;
      const roleChanged = profile?.targetRole?.toLowerCase() !== finalRole.toLowerCase();

      const updated = await syncUserProfile(user.uid, {
        targetRole: finalRole,
        experienceLevel,
        studyHoursPerWeek: studyHours,
        targetTimeline
      });
      
      updateProfileState(updated);
      await refreshProfile();

      // Trigger analysis pipeline if role changed and a resume is present
      if (roleChanged && currentResume?.resumeId) {
        const settings = loadAISettings(user.uid);
        const token = await user.getIdToken();
        
        const response = await fetch("http://127.0.0.1:8000/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            target_role: finalRole,
            upload_id: currentResume.resumeId,
            api_key: settings.apiKey,
            model: settings.model,
            user_profile: updated,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await updateResumeMetadata(currentResume.resumeId, { latestATSScore: data.score });
        }
      }

      await refreshResume();
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save your career goal profile.");
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-100 shadow-xl/10 p-6 md:p-12 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        {/* Wizard Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <Pilo state={loading ? "thinking" : "welcoming"} size={48} />
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Career Goal Setup</h2>
              <p className="text-xs text-slate-400 font-medium">Select your roadmap targets for AI customization</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 h-7 flex items-center justify-center rounded-full">
            Step {step} of 4
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-500"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form Area */}
        <div className="min-h-[350px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Desired Role */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">What is your desired target role?</h3>
                  <p className="text-xs text-slate-400 font-medium">Our Career Intelligence Engine will customize all recommendations to this pathway.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {CAREER_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = selectedRole === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedRole(opt.id)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? "border-primary bg-primary/[0.03] text-primary" 
                            : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50"
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-primary/10 text-primary" : "bg-white text-slate-400 border border-slate-100 shadow-sm"}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-800">{opt.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Custom Role Option */}
                  <button
                    onClick={() => setSelectedRole("Other")}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${
                      selectedRole === "Other"
                        ? "border-primary bg-primary/[0.03] text-primary"
                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${selectedRole === "Other" ? "bg-primary/10 text-primary" : "bg-white text-slate-400 border border-slate-100 shadow-sm"}`}>
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 w-full">
                      <h4 className="text-xs font-bold text-slate-800">Other (Custom Role)</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Enter a custom role and build a dynamic matrix.</p>
                    </div>
                  </button>
                </div>

                {selectedRole === "Other" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Custom target role</label>
                    <input
                      type="text"
                      placeholder="e.g. Solution Architect, Site Reliability Engineer..."
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Current Level */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">What is your current level in this career?</h3>
                  <p className="text-xs text-slate-400 font-medium">This helps us gauge how much foundational vs. advanced learning to recommend.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "Beginner", title: "Beginner / Entry Level", desc: "Little to no industry experience. Ready to learn foundations and build first projects." },
                    { id: "Intermediate", title: "Intermediate / Mid Level", desc: "1-3 years of work experience or solid project background. Looking to specialize and scale." },
                    { id: "Advanced", title: "Advanced / Senior Level", desc: "4+ years of experience. Targeting high-level architecture, systems engineering, and leadership." }
                  ].map((level) => {
                    const isSelected = experienceLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => setExperienceLevel(level.id)}
                        className={`p-6 rounded-2xl border text-left flex flex-col justify-between h-44 transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? "border-primary bg-primary/[0.03] shadow-lg/5" 
                            : "border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50"
                        }`}
                      >
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800">{level.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{level.desc}</p>
                        </div>
                        <div className="flex justify-end w-full">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            isSelected ? "bg-primary border-primary text-white" : "border-slate-200 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Weekly Availability */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">How many hours can you study weekly?</h3>
                  <p className="text-xs text-slate-400 font-medium">We adjust milestone durations and learning curves based on your available study time.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: "5", label: "5 Hours", desc: "Light study" },
                    { id: "10", label: "10 Hours", desc: "Balanced plan" },
                    { id: "15", label: "15 Hours", desc: "Steady progress" },
                    { id: "20", label: "20 Hours", desc: "Fast-track plan" },
                    { id: "30+", label: "30+ Hours", desc: "Full immersion" }
                  ].map((item) => {
                    const isSelected = studyHours === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setStudyHours(item.id)}
                        className={`p-5 rounded-2xl border text-center flex flex-col justify-center items-center h-32 transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? "border-primary bg-primary/[0.03]" 
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <Clock className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                        <h4 className="text-xs font-bold text-slate-800">{item.label}</h4>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Target Timeline */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">What is your target timeline?</h3>
                  <p className="text-xs text-slate-400 font-medium">Select your desired career transition milestone deadline.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: "3 Months", label: "3 Months", desc: "Accelerated pivot" },
                    { id: "6 Months", label: "6 Months", desc: "Standard target" },
                    { id: "12 Months", label: "12 Months", desc: "Gradual upgrade" },
                    { id: "18 Months", label: "18 Months", desc: "Deep transformation" }
                  ].map((item) => {
                    const isSelected = targetTimeline === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTargetTimeline(item.id)}
                        className={`p-5 rounded-2xl border text-center flex flex-col justify-center items-center h-32 transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? "border-primary bg-primary/[0.03]" 
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <Calendar className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                        <h4 className="text-xs font-bold text-slate-800">{item.label}</h4>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-50">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving Pathway...
                </>
              ) : (
                <>
                  {step === 4 ? "Complete Profile" : "Continue"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
