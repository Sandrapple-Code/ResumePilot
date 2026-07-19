"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useResume } from "./useResume";
import { loadAISettings } from "@/services/aiConfig";

export interface ATSAnalysisContextData {
  parsed_resume: any;
  extracted_skills: string[];
  experience: any[];
  education: any[];
  projects: any[];
  certifications: any[];
  target_role: string;
  job_description?: string;
  required_skills: string[];
  missing_skills: string[];
  matched_skills: string[];
  keyword_match: any;
  ats_score: number;
  resume_health: {
    score: number;
    checklist: any[];
    summary_feedback: string;
    experience_feedback: string;
    projects_feedback: string;
    keywords_feedback: string;
    formatting_feedback: string;
    overall_quality: string;
  };
  suggested_improvements: any[];
  
  learning_roadmap: any[];
  recommended_projects: any[];
  job_match_details?: any;
  parsed_job_description?: any;
  career_report?: any;
}

interface ATSAnalysisContextType {
  atsContext: ATSAnalysisContextData | null;
  loading: boolean;
  error: string | null;
  refreshAnalysis: (jobDesc?: string) => Promise<void>;
}

const ATSAnalysisContext = createContext<ATSAnalysisContextType | undefined>(undefined);

export const ATSAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, getIdToken } = useAuth();
  const { currentResume, loading: resumeLoading } = useResume();
  const [atsContext, setAtsContext] = useState<ATSAnalysisContextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = async (jobDesc?: string) => {
    if (!user || !currentResume?.resumeId) {
      setAtsContext(null);
      return;
    }
    setLoading(true);
    try {
      const token = await getIdToken();
      let url = `http://127.0.0.1:8000/users/resumes/${currentResume.resumeId}/ats-context`;
      if (jobDesc !== undefined) {
        url += `?job_desc=${encodeURIComponent(jobDesc)}`;
      }
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAtsContext(data);
        setError(null);
      } else {
        throw new Error("Failed to load ATS Analysis Context.");
      }
    } catch (err: any) {
      console.error("Failed to fetch ATS analysis context:", err);
      setError(err.message || "Failed to load analysis context.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalysis = async (jobDesc?: string) => {
    if (!user || !currentResume?.resumeId) return;
    setLoading(true);
    try {
      const settings = loadAISettings(user.uid);
      const targetRole = profile?.targetRole || "Software Engineer";
      const token = await getIdToken();
      
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          target_role: targetRole,
          upload_id: currentResume.resumeId,
          api_key: settings.apiKey,
          model: settings.model,
          job_description_raw: jobDesc,
          user_profile: profile,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis pipeline failed");
      }

      const data = await response.json();
      setAtsContext(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Sync on resume or target role changes
  useEffect(() => {
    if (!resumeLoading && currentResume?.resumeId) {
      fetchContext();
    } else if (!currentResume) {
      setAtsContext(null);
    }
  }, [currentResume?.resumeId, profile?.targetRole, resumeLoading]);

  return (
    <ATSAnalysisContext.Provider
      value={{
        atsContext,
        loading: loading || resumeLoading,
        error,
        refreshAnalysis
      }}
    >
      {children}
    </ATSAnalysisContext.Provider>
  );
};

export const useATSAnalysis = () => {
  const context = useContext(ATSAnalysisContext);
  if (context === undefined) {
    throw new Error("useATSAnalysis must be used within an ATSAnalysisProvider");
  }
  return context;
};
