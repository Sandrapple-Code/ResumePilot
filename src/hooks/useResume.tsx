"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { getLatestResume, ResumeMetadata } from "@/services/firestore";

interface ResumeContextType {
  currentResume: ResumeMetadata | null;
  loading: boolean;
  refreshResume: () => Promise<void>;
  hasResume: boolean;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentResume, setCurrentResumeState] = useState<ResumeMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshResume = async () => {
    if (!user) {
      setCurrentResumeState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const latest = await getLatestResume(user.uid);
      setCurrentResumeState(latest);
    } catch (err) {
      console.error("Failed to fetch latest resume:", err);
      setCurrentResumeState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshResume();
  }, [user]);

  return (
    <ResumeContext.Provider
      value={{
        currentResume,
        loading,
        refreshResume,
        hasResume: !!currentResume
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
};
