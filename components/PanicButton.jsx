"use client";

import { AlertTriangle } from "lucide-react";

export default function PanicButton() {
  const handlePanic = () => {
    // 1. Clear local and session storage
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
      
      // 2. Redirect away immediately
      // Replace replaces the current history state, so hitting 'back' won't easily return
      window.location.replace("https://www.wikipedia.org");
    }
  };

  return (
    <button
      onClick={handlePanic}
      className="flex items-center justify-center gap-1.5 sm:gap-2 bg-coral hover:opacity-90 active:scale-95 border border-white/20 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(251,78,119,0.5)] hover:shadow-[0_0_20px_rgba(251,78,119,0.7)] transition-all z-50 text-xs sm:text-sm cursor-pointer"
      aria-label="Quick Exit"
    >
      <AlertTriangle size={17} className="sm:w-5 sm:h-5 shrink-0" />
      <span className="hidden sm:inline tracking-wider uppercase text-xs">Quick Exit</span>
    </button>
  );
}
