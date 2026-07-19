"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Pilo } from "@/components/pilo";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { saveResumeMetadata, setCurrentResume, updateResumeMetadata } from "@/services/firestore";
import { loadAISettings } from "@/services/aiConfig";

export default function ResumeUpload() {
  const router = useRouter();
  const { getIdToken, user, profile } = useAuth();
  const { refreshResume, currentResume } = useResume();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "completed">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFile = (selectedFile: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/msword", // doc
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg("Invalid file type. Please upload a PDF or Microsoft Word document (.pdf, .docx, .doc).");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    setErrorMsg("");
    setFile(selectedFile);
    startResumeUpload(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const startResumeUpload = async (selectedFile: File) => {
    setUploadState("uploading");
    setUploadProgress(0);
    setErrorMsg("");
    
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = await getIdToken();
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let detail = "Failed to upload file to backend";
        try {
          const errJson = JSON.parse(errorText);
          detail = errJson.detail || detail;
        } catch (_) {}
        throw new Error(detail);
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update UI state to show real analysis loader animation
      setUploadState("analyzing");
      
      // Perform the real backend analysis request
      const atsResponse = await fetch(`http://127.0.0.1:8000/users/resumes/${data.upload_id}/ats-context`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!atsResponse.ok) {
        const errorText = await atsResponse.text();
        let detail = "Failed to run AI analysis pipeline";
        try {
          const errJson = JSON.parse(errorText);
          detail = errJson.detail || detail;
        } catch (_) {}
        throw new Error(detail);
      }
      
      const atsContextData = await atsResponse.json();
      
      if (user) {
        const metadata = {
          userId: user.uid,
          resumeId: data.upload_id,
          filename: data.filename || (selectedFile ? selectedFile.name : "Resume.pdf"),
          storagePath: `resumes/${user.uid}/${data.upload_id}.pdf`,
          uploadDate: new Date().toISOString(),
          analysisStatus: "completed",
          parsedData: data.parsed_data || {},
          latestATSScore: atsContextData.ats_score,
          latestReportId: data.upload_id
        };
        await saveResumeMetadata(metadata);
        await setCurrentResume(user.uid, data.upload_id);
        await refreshResume();
      }
      
      // Only after successful ATS generation, navigate to Resume Analysis page
      router.push("/analysis");

    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadState("idle");
      setErrorMsg(err.message || "An unexpected error occurred during upload or analysis.");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetUploader = () => {
    setFile(null);
    setUploadState("idle");
    setUploadProgress(0);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Upload Header with Pilo Guideline */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col sm:flex-row items-center gap-6">
        <Pilo
          state={uploadState === "analyzing" ? "thinking" : "happy"}
          bubbleText={
            uploadState === "idle"
              ? "Drop your flight plan (resume) here, pilot, and I'll analyze it right away!"
              : uploadState === "uploading"
              ? "Receiving cargo... Hold tight!"
              : uploadState === "analyzing"
              ? "Cooperating agents are auditing details... Almost there!"
              : "Review complete! Tap below to inspect our findings."
          }
          bubblePosition="right"
          size={85}
        />
      </div>

      {/* Main Drag & Drop / Progress Card */}
      <div className="bg-white border border-border/80 rounded-3xl p-8 shadow-premium min-h-[380px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* IDLE state: Drop Zone */}
          {uploadState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-center"
            >
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                  isDragActive
                    ? "border-primary bg-indigo-50/30"
                    : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-soft text-slate-400">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-slate-700">
                    Drag and drop your resume here, or <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Supports PDF, DOCX, DOC (Max 5MB)
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs font-semibold justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* UPLOADING state: Progress bar */}
          {uploadState === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-center max-w-md mx-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary mx-auto">
                <FileText className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">Uploading: {file?.name}</p>
                <p className="text-[10px] text-slate-400 font-bold">{Math.round((file?.size || 0) / 1024)} KB</p>
              </div>

              {/* Progress Container */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Uploading File...</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ANALYZING state: Agent check list */}
          {uploadState === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 max-w-sm mx-auto"
            >
              <div className="text-center space-y-2 mb-4">
                <div className="w-10 h-10 rounded-full border border-indigo-100 flex items-center justify-center mx-auto bg-indigo-50 text-primary">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <p className="text-sm font-bold text-slate-800">Analyzing Resume...</p>
                <p className="text-[10px] text-slate-400 font-medium">Cooperating agents are auditing details... Almost there!</p>
              </div>

              {/* simulated checklist */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700">Formatting Agent: Audit margins and structure</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-4 h-4 rounded-full border-2 border-indigo-650 border-primary"
                  />
                  <span className="text-xs font-semibold text-slate-700">Keywords Agent: Scan target alignment</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl opacity-60">
                  <div className="w-4 h-4 rounded-full border border-slate-300" />
                  <span className="text-xs font-semibold text-slate-500">Skills Agent: Compare relative job gaps</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPLETED state: Success action */}
          {uploadState === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-center max-w-sm mx-auto"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500 shadow-soft">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-800">Resume Scored & Audited!</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Pilo and co-operating agents have processed <span className="font-bold text-slate-700">{file?.name}</span>. Score dial is ready.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetUploader}
                  className="flex-1 h-11 border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-soft transition-colors"
                >
                  Upload New
                </button>
                <button
                  onClick={() => router.push("/analysis")}
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft transition-colors"
                >
                  Inspect Analysis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Previously Uploaded Resume Info */}
      {uploadState === "idle" && currentResume && (
        <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800">Active Resume</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentResume.filename} • Uploaded on {new Date(currentResume.uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            href="/analysis"
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-soft transition-colors cursor-pointer"
            style={{ backgroundColor: "#4F46E5" }}
          >
            View Active Analysis
          </Link>
        </div>
      )}
    </div>
  );
}
