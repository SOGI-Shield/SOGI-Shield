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
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 py-3 rounded-full font-bold shadow-lg transition-all"
      aria-label="Quick Exit"
    >
      <AlertTriangle size={20} />
      <span className="hidden sm:inline">Quick Exit</span>
    </button>
  );
}
