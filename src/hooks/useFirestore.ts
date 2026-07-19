"use client";

import { useState } from "react";
import { useAuth } from "./useAuth";
import { 
  fetchUserResumes, 
  clearUserResumes, 
  fetchUserReports, 
  fetchCareerReport, 
  deleteUserReport, 
  fetchChatHistory 
} from "@/services/firestore";
import { uploadResumeFile, deleteResumeFile } from "@/services/storage";

export const useFirestore = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getResumes = async () => {
    if (!user) return [];
    setLoading(true);
    try {
      return await fetchUserResumes(user.uid);
    } finally {
      setLoading(false);
    }
  };

  const clearResumes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await clearUserResumes(user.uid);
    } finally {
      setLoading(false);
    }
  };

  const getReports = async () => {
    if (!user) return [];
    setLoading(true);
    try {
      return await fetchUserReports(user.uid);
    } finally {
      setLoading(false);
    }
  };

  const getReport = async (uploadId: string) => {
    setLoading(true);
    try {
      return await fetchCareerReport(uploadId);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (uploadId: string) => {
    setLoading(true);
    try {
      await deleteUserReport(uploadId);
    } finally {
      setLoading(false);
    }
  };

  const getChat = async (conversationId: string) => {
    if (!user) return [];
    setLoading(true);
    try {
      return await fetchChatHistory(user.uid, conversationId);
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (fileId: string, file: File) => {
    if (!user) throw new Error("Unauthenticated");
    setLoading(true);
    try {
      return await uploadResumeFile(user.uid, fileId, file);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (fileId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await deleteResumeFile(user.uid, fileId);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getResumes,
    clearResumes,
    getReports,
    getReport,
    deleteReport,
    getChat,
    uploadResume,
    deleteResume
  };
};
