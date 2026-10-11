"use client";

import dynamic from 'next/dynamic';
import { Globe, Shield } from "lucide-react";

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] md:min-h-[700px] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-linear-to-tr from-cyan-950/30 via-slate-900/40 to-pink-950/20 pointer-events-none" />
      
      {/* Radar pulse animation */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-cyan-500/30 animate-ping absolute opacity-40" />
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-indigo-500/40 animate-pulse absolute" />
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10">
          <Globe className="text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} size={24} />
        </div>
      </div>

      <div className="relative z-10 text-center px-4 space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-widest">
          <Shield size={12} className="text-cyan-400" />
          <span>Zero-Knowledge Map Matrix</span>
        </div>
        <p className="text-slate-200 font-semibold text-sm sm:text-base">
          Initializing Encrypted Incident Map...
        </p>
        <p className="text-slate-400 text-xs max-w-sm mx-auto">
          Loading OpenStreetMap boundaries, verifiable incident pins, and regional hotspots.
        </p>
      </div>
    </div>
  ),
});

export default function Map() {
  return <MapClient />;
}
