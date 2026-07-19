"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Sparkles, User, HelpCircle, Code, Briefcase, Award, Mic, MicOff } from "lucide-react";
import { Pilo, PiloState } from "@/components/pilo";
import { loadAISettings } from "@/services/aiConfig";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Message {
  id: number;
  sender: "user" | "pilo";
  text: string | React.ReactNode;
  time: string;
  sources?: string[];
}

export default function ChatPage() {
  const { getIdToken, user } = useAuth();
  const { currentResume } = useResume();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [piloMascotState, setPiloMascotState] = useState<PiloState>("happy");
  const [activeModel, setActiveModel] = useState("Groq Llama");
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      (window as any)._pilo_recognition?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setPiloMascotState("thinking");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputVal((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    (window as any)._pilo_recognition = recognition;
    recognition.start();
  };

  const quickPrompts = [
    { text: "Suggest Docker resume bullets", type: "devops" },
    { text: "Identify missing frontend skills", type: "skills" },
    { text: "Give me a mock interview question", type: "interview" }
  ];

  useEffect(() => {
    if (user) {
      const settings = loadAISettings(user.uid);
      if (settings.model) {
        setActiveModel(settings.model);
      }
      setHasApiKey(!!settings.apiKey);
    }
  }, [user]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    
    // 2. Set Pilo mascot to thinking and show typing indicator
    setIsTyping(true);
    setPiloMascotState("thinking");

    // 3. Request co-pilot response from RAG backend
    try {
      const settings = loadAISettings(user?.uid);
      if (!settings.apiKey) {
        throw new Error("No API Key Configured. Please navigate to the Settings page to configure your Groq API credentials.");
      }

      const targetRole = currentResume?.parsedData?.target_role || "Software Engineer";

      // Convert local message list to API history schema format
      const historyList = messages.map((m) => ({
        sender: m.sender,
        text: typeof m.text === "string" ? m.text : "",
      }));

      const token = await getIdToken();
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          history: historyList,
          target_role: targetRole,
          api_key: settings.apiKey,
          model: settings.model,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to fetch chat reply");
      }

      const data = await response.json();
      
      const piloMsg: Message = {
        id: Date.now() + 1,
        sender: "pilo",
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources
      };

      setMessages((prev) => [...prev, piloMsg]);
      setIsTyping(false);
      setPiloMascotState(data.mascot_state || "happy");

    } catch (err: any) {
      console.error("Chat RAG fetch error:", err);
      const piloMsg: Message = {
        id: Date.now() + 1,
        sender: "pilo",
        text: `Oops! I encountered an error: ${err.message}. Let's make sure your API credentials are valid on the Settings page.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, piloMsg]);
      setIsTyping(false);
      setPiloMascotState("confused");
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (!hasApiKey) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-soft">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">API Provider Configuration Required</h3>
          <p className="text-xs text-slate-655 font-semibold leading-relaxed text-slate-600">
            Configure your AI Provider in Settings to unlock AI features.
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans items-stretch min-h-[calc(100vh-120px)]">
      
      {/* Left Column (3 cols): Mascot interactive display */}
      <div className="lg:col-span-3 bg-white border border-border/80 rounded-3xl p-6 shadow-soft flex flex-col justify-between items-center text-center">
        <div className="space-y-6 w-full flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">CO-PILOT CONVERSATION</span>
          
          {/* Animated Pilo Mascot */}
          <div className="relative p-6 bg-slate-50 border border-slate-100 rounded-2xl w-full flex items-center justify-center min-h-[160px]">
            <Pilo state={piloMascotState} size={110} />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-800">Pilo the Pilot Bear</h4>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">AI Career Autopilot Guide</p>
          </div>
        </div>

        {/* Suggestion tags */}
        <div className="w-full space-y-2.5 pt-6 border-t border-slate-100 mt-6">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block text-left">TALK TO ME ABOUT</span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-600 text-left">
              <Code className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span>Resume bullet rewrites</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-600 text-left">
              <Briefcase className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Technical interview prep</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-600 text-left">
              <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Bridging missing skill gaps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (9 cols): Chat Canvas */}
      <div className="lg:col-span-9 bg-white border border-border/80 rounded-3xl shadow-premium flex flex-col justify-between overflow-hidden">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Ask Pilo</h3>
              <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Autopilot Active</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-wider">
              Powered by RAG
            </span>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-accent rounded-lg text-primary text-[10px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeModel}</span>
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 h-full my-auto">
              <Pilo state="happy" size={70} />
              <h4 className="text-xs font-bold text-slate-700">Start your first conversation with Pilo.</h4>
              <p className="text-[10px] text-slate-500 font-semibold max-w-xs leading-normal">
                Ask questions about your resume gaps, request phrasing improvements, or ask for career guidance.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isPilo = msg.sender === "pilo";
              return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isPilo ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-soft ${
                  isPilo ? "bg-indigo-550 bg-indigo-50 text-primary border border-indigo-100" : "bg-primary text-white"
                }`}>
                  {isPilo ? "P" : "U"}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium ${
                  isPilo
                    ? "bg-slate-50 text-slate-700 border border-slate-200/50"
                    : "bg-primary text-white shadow-soft"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {isPilo && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-semibold text-left">
                      <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-bold mb-1">Sources Used:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <span key={sIdx} className="px-1.5 py-0.5 bg-indigo-50/80 border border-indigo-100 rounded text-[9px] text-primary font-bold">
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`text-[9px] block text-right mt-1.5 opacity-60 font-semibold`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })
        )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary text-xs font-bold shadow-soft flex-shrink-0">
                P
              </div>
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl px-4 py-3.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area & Quick Prompts */}
        <div className="p-4 border-t border-border/60 bg-slate-50/20 space-y-4">
          
          {/* Quick Prompts Panel */}
          {(messages.length === 0 || messages.length === 1) && (
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((p) => (
                <button
                  key={p.text}
                  onClick={() => handleSendMessage(p.text)}
                  className="px-3.5 py-2 bg-white border border-slate-200/80 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-650 text-slate-600 shadow-soft transition-all flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input text form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="flex gap-2.5 items-center"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Pilo: 'What are my resume gaps?' or 'Draft a bullet with Docker...'"
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200/80 bg-white text-xs text-slate-800 focus:outline-none focus:border-primary/50 transition-all font-semibold"
            />
             <button
              type="button"
              onClick={toggleListening}
              className={`w-11 h-11 border rounded-xl flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                isListening
                  ? "bg-rose-50 border-rose-200 text-rose-500 animate-pulse"
                  : "border-slate-200/80 hover:border-slate-350 text-slate-500 hover:text-slate-700 bg-white"
              }`}
              title={isListening ? "Listening... Click to stop" : "Start Voice Input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              className="w-11 h-11 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-soft flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
