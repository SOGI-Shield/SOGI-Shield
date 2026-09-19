"use client";

import dynamic from 'next/dynamic';
import { AlertCircle, FileText, Globe2 } from "lucide-react";
import Map from "@/components/Map";

// Dynamically import HomepageMetrics and disable SSR to prevent Firebase/protobufjs crashing Cloudflare Workers
const HomepageMetrics = dynamic(() => import("@/components/HomepageMetrics"), { 
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-slate-800/50 rounded-xl max-w-6xl w-full mx-auto mt-8"></div>
});

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
      <section className="w-full max-w-6xl mb-8 text-center mt-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
          Documentation as Resistance
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
          A secure, zero-touch platform for tracking global SOGI-related human rights violations. 
          Verified evidence is made public. Unverified reports are safely aggregated to identify regional hotspots without risking liability.
        </p>
      </section>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-start gap-4 hover:bg-slate-800/40 transition-colors shadow-lg">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20"><Globe2 size={24} /></div>
          <div>
            <h3 className="font-bold text-lg text-white">Global Heatmap</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">Aggregated, generalized data protects victims while showing crisis zones.</p>
          </div>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-start gap-4 hover:bg-slate-800/40 transition-colors shadow-lg">
          <div className="p-3 bg-gradient-to-br from-red-500/20 to-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20"><AlertCircle size={24} /></div>
          <div>
            <h3 className="font-bold text-lg text-white">Verified Markers</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">Reports with public evidence links map distinct facility locations.</p>
          </div>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-start gap-4 hover:bg-slate-800/40 transition-colors shadow-lg">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-400 rounded-xl border border-emerald-500/20"><FileText size={24} /></div>
          <div>
            <h3 className="font-bold text-lg text-white">Action Portal</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">Copy templates to file complaints with the UN and international bodies.</p>
          </div>
        </div>
      </div>

      <section className="w-full max-w-6xl flex-1 min-h-[600px] md:min-h-[700px] border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative mb-12 z-10 bg-slate-900/50 backdrop-blur-sm">
        <Map />
      </section>

      <HomepageMetrics />
    </div>
  );
}
