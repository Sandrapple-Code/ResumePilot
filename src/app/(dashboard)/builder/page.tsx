"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileSignature, Sparkles, CheckCircle2, TrendingUp, Info, Plus, Trash2 } from "lucide-react";
import { Pilo } from "@/components/pilo";
import { useAuth } from "@/hooks/useAuth";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  jobTitle: string;
  company: string;
  jobBullets: string[];
}

export default function ResumeBuilder() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    summary: "",
    skills: "",
    jobTitle: "",
    company: "",
    jobBullets: [""]
  });

  const [atsScore, setAtsScore] = useState(0);

  // Sync with Firebase user on login
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: profile?.name || user.displayName || "",
        email: user.email || ""
      }));
    }
  }, [user, profile]);

  // Live ATS score calculator based on keywords and bullet lengths
  useEffect(() => {
    let score = 60;
    
    // Check for core keywords
    const lowerSkills = formData.skills.toLowerCase();
    const lowerBullets = formData.jobBullets.join(" ").toLowerCase();
    const lowerSummary = formData.summary.toLowerCase();

    if (lowerSkills.includes("react")) score += 5;
    if (lowerSkills.includes("typescript")) score += 5;
    if (lowerSkills.includes("docker")) score += 10;
    if (lowerSkills.includes("jest") || lowerBullets.includes("jest")) score += 10;
    if (lowerBullets.includes("docker") || lowerSkills.includes("docker")) score += 5;
    
    // Check for metrics/numbers in bullets
    const hasNumbers = /\d+/.test(formData.jobBullets.join(" "));
    if (hasNumbers) score += 5;

    // Check for strong verbs
    if (lowerBullets.includes("designed") || lowerBullets.includes("engineered") || lowerBullets.includes("architected") || lowerBullets.includes("collaborated")) {
      score += 5;
    }

    setAtsScore(Math.min(score, 100));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulletChange = (index: number, value: string) => {
    const updated = [...formData.jobBullets];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, jobBullets: updated }));
  };

  const addBullet = () => {
    setFormData((prev) => ({ ...prev, jobBullets: [...prev.jobBullets, ""] }));
  };

  const deleteBullet = (index: number) => {
    const updated = formData.jobBullets.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, jobBullets: updated }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 font-sans items-stretch">
      {/* Left Column (6 cols): Form Builder */}
      <div className="xl:col-span-6 space-y-6">
        {/* Mascot guideline card */}
        <div className="bg-white border border-border/80 rounded-3xl p-5 shadow-soft flex gap-4 items-center">
          <Pilo state="happy" size={75} className="flex-shrink-0" />
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
            <span className="font-bold text-slate-700 block mb-0.5">Live Score Optimization</span>
            Add the recommended keywords <span className="font-bold text-indigo-650 text-primary">Docker</span> and <span className="font-bold text-indigo-650 text-primary">Jest</span> to your skills or bullets to watch your ATS score climb in real time!
          </div>
        </div>

        {/* Builder Form Card */}
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <FileSignature className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">Resume Metadata Form</h3>
          </div>

          <div className="space-y-4">
            {/* Full Name & Contacts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Summary</label>
              <textarea
                name="summary"
                rows={3}
                value={formData.summary}
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
              />
            </div>

            {/* Skills */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills (Comma Separated)</label>
                <span className="text-[9px] text-slate-400 font-bold">Bridge Gaps here!</span>
              </div>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="React, TypeScript, Jest, Docker..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
              />
            </div>

            {/* Job details */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 tracking-wider">PROFESSIONAL EXPERIENCE</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Bullets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience Bullets</label>
                  <button
                    onClick={addBullet}
                    className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bullet</span>
                  </button>
                </div>
                
                <div className="space-y-2.5">
                  {formData.jobBullets.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2">
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => handleBulletChange(idx, e.target.value)}
                        placeholder="Describe action, tech used, and numeric results..."
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                      />
                      <button
                        onClick={() => deleteBullet(idx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-colors self-start mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Column (6 cols): Real-Time Template Preview */}
      <div className="xl:col-span-6 space-y-4">
        {/* Header Preview bar with Live Score Dial */}
        <div className="bg-white border border-border/80 rounded-2xl p-4 shadow-soft flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LIVE TEMPLATE PREVIEW</span>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>ATS Score</span>
            </div>
            <div className="h-6 w-12 bg-primary text-white text-xs font-extrabold rounded-lg flex items-center justify-center shadow-soft animate-soft-pulse">
              {atsScore}
            </div>
          </div>
        </div>

        {/* Paper Simulation */}
        <div className="bg-white border border-border/80 rounded-2xl p-8 shadow-premium text-slate-800 text-[10px] space-y-5 leading-normal min-h-[580px]">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{formData.fullName || "Your Name"}</h3>
            <p className="text-[9px] text-slate-500 font-medium">{formData.email || "email@address.com"} • {formData.phone || "phone"} • github.com/username</p>
          </div>

          {/* Professional Summary */}
          {formData.summary && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-bold text-indigo-650 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5 text-primary">Professional Summary</h4>
              <p className="text-slate-600 leading-normal font-medium">{formData.summary}</p>
            </div>
          )}

          {/* Technical Skills */}
          {formData.skills && (
            <div className="space-y-1">
              <h4 className="text-[9px] font-bold text-indigo-650 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5 text-primary">Technical Skills</h4>
              <p className="text-slate-600 leading-normal font-medium">
                <span className="font-bold text-slate-800">Core Technologies:</span> {formData.skills}
              </p>
            </div>
          )}

          {/* Experience */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold text-indigo-650 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5 text-primary">Professional Experience</h4>
            
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{formData.jobTitle || "Job Title"} • {formData.company || "Company"}</span>
                <span>2024 - Present</span>
              </div>
              <ul className="list-disc pl-3.5 text-slate-600 space-y-1 font-medium">
                {formData.jobBullets.map((bullet, idx) => (
                  <li key={idx}>{bullet || "Drafting description..."}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Education Placeholder */}
          <div className="space-y-1">
            <h4 className="text-[9px] font-bold text-indigo-650 tracking-wide uppercase border-b border-indigo-50/50 pb-0.5 text-primary">Education</h4>
            <div className="flex justify-between font-bold text-slate-800">
              <span>B.S. Computer Science • University of Technology</span>
              <span>2019 - 2023</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
