"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, User, Sliders, Bell, Sparkles, Save, ShieldCheck,
  Eye, EyeOff, Copy, Check, Trash2, Clipboard, RefreshCw, 
  CheckCircle2, XCircle, AlertCircle 
} from "lucide-react";
import { Pilo } from "@/components/pilo";
import { loadAISettings, saveAISettings, deleteAPIKey, resetAISettings } from "@/services/aiConfig";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { syncUserProfile } from "@/services/firestore";

export default function SettingsPage() {
  const { user, updateProfileState } = useAuth();
  const { profile: firestoreProfile, settings: firestoreSettings, updateSettings } = useUser();

  const [profile, setProfile] = useState({
    fullName: "",
    targetRole: "",
    email: "",
    bio: "",
    experienceLevel: "",
    education: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [agentPreferences, setAgentPreferences] = useState({
    depth: "debate", // quick | deep | debate
    atsAgent: true,
    keywordsAgent: true,
    skillsAgent: true,
    formatAgent: false,
  });

  const [notificationToggles, setNotificationToggles] = useState({
    emailAlerts: true,
    weeklyMatches: false,
    scoreDropAlerts: true,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // AI Configuration States
  const [aiProvider, setAiProvider] = useState("Groq");
  const [aiModel, setAiModel] = useState("Llama 3.3 70B");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Synchronize Firestore profile and settings into state on load
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: firestoreProfile?.name || "",
        email: firestoreProfile?.email || user.email || "",
        targetRole: firestoreProfile?.targetRole || "",
        bio: firestoreProfile?.bio || "",
        experienceLevel: firestoreProfile?.experienceLevel || "Entry",
        education: firestoreProfile?.education || ""
      });
      const localAISettings = loadAISettings(user.uid);
      setApiKey(localAISettings.apiKey || "");
      setIsApiKeySaved(!!localAISettings.apiKey);
    }
  }, [user, firestoreProfile]);

  useEffect(() => {
    if (firestoreProfile) {
      setAiProvider(firestoreProfile.preferredProvider || "Groq");
      setAiModel(firestoreProfile.preferredModel || "Llama 3.3 70B");
    }
    if (firestoreSettings) {
      if (firestoreSettings.preferences) {
        setAgentPreferences(prev => ({ ...prev, ...firestoreSettings.preferences }));
      }
    }
  }, [firestoreSettings, firestoreProfile]);

  const handleProviderChange = async (provider: string) => {
    setAiProvider(provider);
    await updateSettings({ preferredProvider: provider });
    showFeedback("Provider configuration loaded.");
  };

  const handleModelChange = async (model: string) => {
    setAiModel(model);
    await updateSettings({ preferredModel: model });
    showFeedback("Preferred model updated.");
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      showFeedback("Please enter a valid API Key.");
      return;
    }
    setIsValidating(true);
    showFeedback("Validating API Key with Groq...");
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://127.0.0.1:8000/validate-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: aiProvider,
          api_key: apiKey,
          model: aiModel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        await updateSettings({ apiKey, preferredProvider: aiProvider, preferredModel: aiModel });
        saveAISettings({ apiKey, provider: aiProvider, model: aiModel }, user?.uid);
        setIsApiKeySaved(true);
        showFeedback(`API Key validated and saved! Latency: ${data.latency_ms}ms`);
      } else {
        setIsApiKeySaved(false);
        showFeedback(`Validation failed: ${data.message || "Invalid Key details"}`);
      }
    } catch (err) {
      console.error("API Key validation error:", err);
      // Fallback save
      await updateSettings({ apiKey, preferredProvider: aiProvider, preferredModel: aiModel });
      saveAISettings({ apiKey, provider: aiProvider, model: aiModel }, user?.uid);
      setIsApiKeySaved(true);
      showFeedback("Connection error. Settings saved locally.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteApiKey = async () => {
    await updateSettings({ apiKey: "" });
    deleteAPIKey(user?.uid);
    setApiKey("");
    setIsApiKeySaved(false);
    showFeedback("API Key deleted successfully.");
  };

  const handleClearKey = () => {
    setApiKey("");
    setIsApiKeySaved(false);
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKey(text);
        setIsApiKeySaved(false);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleResetSettings = async () => {
    resetAISettings(user?.uid);
    await updateSettings({
      preferredProvider: "Groq",
      preferredModel: "Llama 3.3 70B",
      apiKey: ""
    });
    setAiProvider("Groq");
    setAiModel("Llama 3.3 70B");
    setApiKey("");
    setIsApiKeySaved(false);
    showFeedback("AI settings reset to defaults.");
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate profile fields
    const errs: Record<string, string> = {};
    if (!profile.fullName.trim()) {
      errs.fullName = "Name cannot be empty.";
    } else if (profile.fullName.length > 50) {
      errs.fullName = "Name maximum length is 50 characters.";
    }
    
    if (!profile.targetRole.trim()) {
      errs.targetRole = "Target Role cannot be empty.";
    } else if (profile.targetRole.length > 100) {
      errs.targetRole = "Target Role maximum length is 100 characters.";
    }
    
    if (profile.bio.length > 300) {
      errs.bio = "Bio maximum length is 300 characters.";
    }

    if (!profile.education.trim()) {
      errs.education = "Education cannot be empty.";
    }
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoadingProfile(true);
    try {
      if (user) {
        const updated = await syncUserProfile(user.uid, {
          name: profile.fullName,
          targetRole: profile.targetRole,
          bio: profile.bio,
          experienceLevel: profile.experienceLevel,
          education: profile.education,
          preferredProvider: aiProvider,
          preferredModel: aiModel
        });
        
        // Update global shared profile state instantly
        updateProfileState(updated);
        
        // Save preferences
        await updateSettings({
          preferences: agentPreferences
        });
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Mascot Guideline */}
      <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col sm:flex-row items-center gap-6">
        <Pilo
          state="happy"
          bubbleText="Set your coordinates here, pilot! Adjust my analysis speed or select which agents to deploy during audits."
          bubblePosition="right"
          size={85}
        />
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side (8 columns): Settings Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile Section */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Target Profile Parameters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className={`w-full h-10 px-3 rounded-xl border ${errors.fullName ? "border-rose-400 focus:border-rose-500" : "border-slate-200"} bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all`}
                />
                {errors.fullName && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{errors.fullName}</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Job Role</label>
                <input
                  type="text"
                  value={profile.targetRole}
                  onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                  className={`w-full h-10 px-3 rounded-xl border ${errors.targetRole ? "border-rose-400 focus:border-rose-500" : "border-slate-200"} bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all`}
                />
                {errors.targetRole && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{errors.targetRole}</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience Level</label>
                <select
                  value={profile.experienceLevel}
                  onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Education</label>
                <input
                  type="text"
                  value={profile.education}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  className={`w-full h-10 px-3 rounded-xl border ${errors.education ? "border-rose-400 focus:border-rose-500" : "border-slate-200"} bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all`}
                />
                {errors.education && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{errors.education}</span>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bio / Professional Summary</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself, your career path, or special skills..."
                  rows={3}
                  className={`w-full p-3 rounded-xl border ${errors.bio ? "border-rose-400 focus:border-rose-500" : "border-slate-200"} bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all resize-none`}
                />
                {errors.bio && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{errors.bio}</span>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notification Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full h-10 px-3 rounded-xl border border-slate-250 bg-slate-100/50 text-xs font-semibold text-slate-400 focus:outline-none cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* AI Agent Configuration */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Sliders className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">AI Agent Preferences</h3>
            </div>

            <div className="space-y-5">
              {/* Depth Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Analysis Depth Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "quick", title: "Quick Scan", desc: "Basic syntax & keyword count" },
                    { id: "deep", title: "Deep Audit", desc: "Contextual semantic matching" },
                    { id: "debate", title: "Agentic Debate", desc: "Multi-agent review collaboration" }
                  ].map((mode) => (
                    <button
                      type="button"
                      key={mode.id}
                      onClick={() => setAgentPreferences({ ...agentPreferences, depth: mode.id })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        agentPreferences.depth === mode.id
                          ? "bg-indigo-50/20 border-primary ring-2 ring-primary/5"
                          : "bg-slate-50/30 border-slate-200/80 hover:border-slate-350"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-800">{mode.title}</h4>
                      <p className="text-[9px] text-slate-450 text-slate-400 mt-0.5 leading-normal">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles for Individual Agents */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Activate Specific Audit Agents</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "atsAgent", name: "ATS Compliance Agent", desc: "Scans document formatting standards" },
                    { id: "keywordsAgent", name: "Keywords Auditor Agent", desc: "Crawls industry keyword densities" },
                    { id: "skillsAgent", name: "Skills Gap Analyzer Agent", desc: "Compares current profile to market targets" },
                    { id: "formatAgent", name: "Formatting Beautifier Agent", desc: "Simulates PDF page formatting checks" }
                  ].map((agent) => {
                    const key = agent.id as keyof typeof agentPreferences;
                    const isActive = agentPreferences[key];
                    
                    return (
                      <div
                        key={agent.id}
                        onClick={() => setAgentPreferences({ ...agentPreferences, [key]: !isActive })}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isActive ? "bg-slate-50/50 border-slate-250 border-slate-200" : "bg-white border-slate-200 opacity-60"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-850 text-slate-700">{agent.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{agent.desc}</p>
                        </div>
                        <div className={`w-8 h-4.5 bg-slate-200 rounded-full p-0.5 transition-colors relative flex items-center ${isActive ? "bg-primary" : "bg-slate-200"}`}>
                          <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${isActive ? "translate-x-3.5" : ""}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Provider & API Key Configuration */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">AI Provider Configuration</h3>
            </div>

            {feedbackMsg && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-primary text-[10px] font-bold text-center animate-pulse">
                {feedbackMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Provider & Model Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Provider</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Groq">Groq Cloud (Active)</option>
                    <option value="Gemini" disabled>Google Gemini (Placeholder)</option>
                    <option value="Claude" disabled>Anthropic Claude (Placeholder)</option>
                    <option value="OpenAI" disabled>OpenAI GPT (Placeholder)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preferred Model</label>
                  <select
                    value={aiModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Llama 3.3 70B">Llama 3.3 70B (Default)</option>
                    <option value="DeepSeek R1">DeepSeek R1</option>
                    <option value="Kimi K2">Kimi K2</option>
                    <option value="Gemini 1.5 Flash" disabled>Gemini 1.5 Flash (Future)</option>
                    <option value="Claude 3.5 Sonnet" disabled>Claude 3.5 Sonnet (Future)</option>
                    <option value="GPT-4o" disabled>GPT-4o (Future)</option>
                  </select>
                </div>
              </div>

              {/* API Key Management */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {aiProvider} API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setIsApiKeySaved(false);
                      }}
                      placeholder={`Enter your ${aiProvider} API Key`}
                      className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handlePasteKey}
                      title="Paste from Clipboard"
                      className="w-10 h-10 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      title="Copy Key"
                      className="w-10 h-10 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearKey}
                      title="Clear Input"
                      className="h-10 px-3 border border-slate-200 bg-slate-50/20 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    disabled={isValidating}
                    onClick={handleSaveApiKey}
                    className="flex-1 h-10 bg-indigo-50 hover:bg-indigo-100 text-primary text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isValidating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{isValidating ? "Validating..." : "Save Key"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteApiKey}
                    className="h-10 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    title="Reset AI Provider Settings"
                    className="h-10 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Board */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">AI Connection Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Provider</span>
                    <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5">{aiProvider}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Active Model</span>
                    <span className="text-[10px] font-extrabold text-slate-700 block mt-0.5 truncate">{aiModel}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">API Key Status</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isApiKeySaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600">Configured</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[10px] font-bold text-rose-600">Not Configured</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Connection</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isApiKeySaved ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-amber-600">Offline (Mocked)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[10px] font-bold text-rose-600 font-semibold">No Key</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (4 columns): Notifications & Action Buttons */}
        <div className="lg:col-span-4 flex flex-col gap-6 justify-between items-stretch">
          {/* Notifications Card */}
          <div className="bg-white border border-border/80 rounded-3xl p-6 shadow-soft space-y-4 flex-1">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Bell className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Notification Rules</h3>
            </div>

            <div className="space-y-4">
              {[
                { id: "emailAlerts", name: "Score Drop Alerts", desc: "Notify when ATS keyword matches shift" },
                { id: "weeklyMatches", name: "Weekly Project Matches", desc: "Email matching repositories weekly" },
                { id: "scoreDropAlerts", name: "Agent Status Updates", desc: "Get notifications when analysis is complete" }
              ].map((notif) => {
                const key = notif.id as keyof typeof notificationToggles;
                const isActive = notificationToggles[key];

                return (
                  <div
                    key={notif.id}
                    onClick={() => setNotificationToggles({ ...notificationToggles, [key]: !isActive })}
                    className="flex justify-between items-center cursor-pointer select-none group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{notif.name}</p>
                      <p className="text-[9px] text-slate-400 leading-normal mt-0.5">{notif.desc}</p>
                    </div>
                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${isActive ? "bg-primary" : "bg-slate-200"}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${isActive ? "translate-x-3.5" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-6 lg:pt-0">
            <button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>

            {isSaved && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 justify-center text-emerald-600 text-xs font-semibold animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                <span>Preferences Saved Successfully!</span>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
