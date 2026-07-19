"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type PiloState = "happy" | "thinking" | "confused" | "pointing" | "welcoming";

interface PiloProps {
  state?: PiloState;
  bubbleText?: string | React.ReactNode;
  bubblePosition?: "top" | "left" | "right" | "bottom";
  className?: string;
  size?: number;
}

export const Pilo: React.FC<PiloProps> = ({
  state = "happy",
  bubbleText,
  bubblePosition = "right",
  className = "",
  size = 120,
}) => {
  // SVG paths/elements based on Pilo's state
  const renderEyes = () => {
    switch (state) {
      case "thinking":
        return (
          <>
            {/* Thinking eyes looking upwards */}
            <circle cx="42" cy="50" r="3.5" fill="#1E293B" />
            <circle cx="58" cy="50" r="3.5" fill="#1E293B" />
            {/* Small light reflection */}
            <circle cx="43.5" cy="48.5" r="1" fill="#FFFFFF" />
            <circle cx="59.5" cy="48.5" r="1" fill="#FFFFFF" />
            {/* Thinking eyebrow */}
            <path d="M38 43 Q42 41 46 44" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M54 44 Q58 41 62 43" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        );
      case "confused":
        return (
          <>
            {/* One squiggly/squinting eye, one open eye */}
            <path d="M38 52 L46 48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="58" cy="50" r="3.5" fill="#1E293B" />
            <circle cx="59.5" cy="48.5" r="1" fill="#FFFFFF" />
            {/* Raised eyebrow */}
            <path d="M53 42 Q58 39 63 43" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        );
      case "happy":
      case "welcoming":
      default:
        return (
          <>
            {/* Happy smiling eyes (curved lines) */}
            <path d="M37 51 Q42 46 47 51" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M53 51 Q58 46 63 51" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
    }
  };

  const renderMouth = () => {
    switch (state) {
      case "thinking":
        return (
          /* Small straight/thoughtful line */
          <path d="M46 63 L54 63" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        );
      case "confused":
        return (
          /* Slightly squiggly/crooked mouth */
          <path d="M46 64 Q50 61 54 65" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        );
      case "happy":
      case "welcoming":
      default:
        return (
          /* Wide friendly smile */
          <path d="M45 61 Q50 67 55 61" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        );
    }
  };

  const renderGogglesPosition = () => {
    switch (state) {
      case "thinking":
        // Goggles down over the eyes
        return { y: 6 };
      default:
        // Goggles pushed up on forehead
        return { y: -6 };
    }
  };

  // Position class for the bubble speech bubble
  const getBubblePositionClass = () => {
    switch (bubblePosition) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-4";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-4";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-4";
      case "right":
      default:
        return "left-full top-1/2 -translate-y-1/2 ml-4";
    }
  };

  const getBubbleTailClass = () => {
    switch (bubblePosition) {
      case "top":
        return "top-full left-1/2 -translate-x-1/2 border-t-white border-x-transparent border-b-transparent border-8";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-l-white border-y-transparent border-r-transparent border-8";
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-b-white border-x-transparent border-t-transparent border-8";
      case "right":
      default:
        return "right-full top-1/2 -translate-y-1/2 border-r-white border-y-transparent border-l-transparent border-8";
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {bubbleText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`absolute z-20 w-60 sm:w-72 max-w-xs px-4 py-3 bg-white text-slate-700 text-sm font-medium rounded-2xl shadow-premium border border-border/80 ${getBubblePositionClass()}`}
          >
            <div className="relative z-10">{bubbleText}</div>
            {/* Bubble Tail */}
            <div className={`absolute w-0 h-0 border-solid ${getBubbleTailClass()}`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Graphic container */}
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width: size, height: size }}
        className="relative select-none cursor-pointer"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Bear Body */}
          <path d="M30 85 C30 75 40 70 50 70 C60 70 70 75 70 85" fill="#B47B52" stroke="#9A6139" strokeWidth="2.5" />

          {/* Left Ear */}
          <circle cx="28" cy="32" r="11" fill="#B47B52" stroke="#9A6139" strokeWidth="2.5" />
          <circle cx="28" cy="32" r="6" fill="#F9A8A8" />

          {/* Right Ear */}
          <circle cx="72" cy="32" r="11" fill="#B47B52" stroke="#9A6139" strokeWidth="2.5" />
          <circle cx="72" cy="32" r="6" fill="#F9A8A8" />

          {/* Bear Head */}
          <circle cx="50" cy="52" r="28" fill="#D39E75" stroke="#9A6139" strokeWidth="2.5" />

          {/* Rosy Cheeks */}
          <circle cx="31" cy="58" r="4.5" fill="#FCA5A5" fillOpacity="0.4" />
          <circle cx="69" cy="58" r="4.5" fill="#FCA5A5" fillOpacity="0.4" />

          {/* Muzzle/Snout */}
          <ellipse cx="50" cy="60" rx="13" ry="10" fill="#FFF2E7" stroke="#D39E75" strokeWidth="1.5" />

          {/* Nose */}
          <path d="M47 55 H53 C53 55 53 58 50 60 C47 58 47 55 47 55 Z" fill="#1E293B" />

          {/* Mouth */}
          {renderMouth()}

          {/* Eyes */}
          {renderEyes()}

          {/* Pilot Aviator Goggles */}
          <motion.g animate={renderGogglesPosition()} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
            {/* Goggle Strap */}
            <path d="M22 40 C22 40 30 38 50 38 C70 38 78 40 78 40" stroke="#312E81" strokeWidth="6" strokeLinecap="round" />
            <path d="M22 40 C22 40 30 38 50 38 C70 38 78 40 78 40" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />

            {/* Left Glass & Rim */}
            <circle cx="38" cy="40" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <circle cx="38" cy="40" r="7" fill="#93C5FD" fillOpacity="0.75" />
            <path d="M34 37 L41 44" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

            {/* Bridge */}
            <rect x="44" y="38" width="12" height="4" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />

            {/* Right Glass & Rim */}
            <circle cx="62" cy="40" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
            <circle cx="62" cy="40" r="7" fill="#93C5FD" fillOpacity="0.75" />
            <path d="M58 37 L65 44" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>

          {/* Goggles reflection shine details */}
          {state === "welcoming" && (
            <path d="M20 72 Q25 65 30 75" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Goggle strap side adjustment clips */}
          <rect x="20" y="38" width="3" height="6" rx="1.5" fill="#F59E0B" />
          <rect x="77" y="38" width="3" height="6" rx="1.5" fill="#F59E0B" />

          {state === "pointing" && (
            <motion.path
              initial={{ rotate: -20 }}
              animate={{ rotate: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              d="M72 65 C78 63 86 63 88 66 C90 69 84 73 75 72"
              stroke="#9A6139"
              strokeWidth="2.5"
              fill="#B47B52"
            />
          )}
        </svg>
      </motion.div>
    </div>
  );
};
