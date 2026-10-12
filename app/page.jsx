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
      <section className="w-full max-w-6xl mb-10 text-center mt-6 sm:mt-12 flex flex-col items-center">
        {/* Hero Headline with Clean White Contrast & Vibrant Brand Accent */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-5 max-w-4xl leading-[1.1]">
          Documentation as <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FB4E77] via-[#584BE0] to-[#00D99D]">Resistance</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto px-4 sm:px-0 leading-relaxed font-normal">
          A secure, zero-touch platform for tracking global SOGI human rights violations. 
          Verified evidence is mapped for institutional accountability, while confidential testimonies remain sealed under zero-knowledge integrity.
        </p>
      </section>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-[#00D99D]/40 p-5 sm:p-6 rounded-2xl flex items-start gap-4 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(0,217,157,0.15)] group">
          <div className="p-3 bg-[#00D99D]/15 text-[#00D99D] rounded-xl border border-[#00D99D]/30 shrink-0 group-hover:scale-105 transition-transform"><Globe2 size={24} /></div>
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-[#00D99D] transition-colors">Global Heatmap</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">Aggregated, generalized data protects victims while showing crisis zones.</p>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-[#FB4E77]/40 p-5 sm:p-6 rounded-2xl flex items-start gap-4 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(251,78,119,0.15)] group">
          <div className="p-3 bg-[#FB4E77]/15 text-[#FB4E77] rounded-xl border border-[#FB4E77]/30 shrink-0 group-hover:scale-105 transition-transform"><AlertCircle size={24} /></div>
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-[#FB4E77] transition-colors">Verified Markers</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">Reports with public evidence links map distinct facility locations.</p>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-[#584BE0]/50 p-5 sm:p-6 rounded-2xl flex items-start gap-4 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(88,75,224,0.25)] group">
          <div className="p-3 bg-[#584BE0]/20 text-white rounded-xl border border-[#584BE0]/40 shrink-0 group-hover:scale-105 transition-transform"><FileText size={24} className="text-[#00D99D]" /></div>
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-white transition-colors">Action Portal</h3>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">Copy templates to file complaints with the UN and international bodies.</p>
          </div>
        </div>
      </div>

      <section className="w-full max-w-6xl flex-1 min-h-[450px] md:min-h-[700px] border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative mb-12 z-10 bg-slate-900/50 backdrop-blur-sm">
        <Map />
      </section>

      <HomepageMetrics />
    </div>
  );
}
