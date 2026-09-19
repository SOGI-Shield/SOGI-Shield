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
      className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 border border-red-400/50 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-bold shadow-[0_0_15px_rgba(225,29,72,0.6)] transition-all z-50"
      aria-label="Quick Exit"
    >
      <AlertTriangle size={20} />
      <span className="hidden sm:inline tracking-wide">QUICK EXIT</span>
    </button>
  );
}
