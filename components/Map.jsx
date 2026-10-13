"use client";

import dynamic from 'next/dynamic';
import { Globe } from "lucide-react";

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] md:min-h-[700px] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-linear-to-tr from-iris/20 via-slate-950/60 to-coral/15 pointer-events-none" />
      
      {/* Radar pulse animation */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-mint/40 animate-ping absolute opacity-40" />
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-iris/50 animate-pulse absolute" />
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(88,75,224,0.6)] z-10">
          <Globe className="text-mint animate-spin" style={{ animationDuration: "12s" }} size={24} />
        </div>
      </div>

      <div className="relative z-10 text-center px-4 space-y-2">
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
