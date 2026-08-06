import Map from "@/components/Map";
import { AlertCircle, FileText, Globe2 } from "lucide-react";

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

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg"><Globe2 size={24} /></div>
          <div>
            <h3 className="font-bold text-lg">Global Heatmap</h3>
            <p className="text-slate-400 text-sm mt-1">Aggregated, generalized data protects victims while showing crisis zones.</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-start gap-4">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-lg"><AlertCircle size={24} /></div>
          <div>
            <h3 className="font-bold text-lg">Verified Markers</h3>
            <p className="text-slate-400 text-sm mt-1">Reports with public evidence links map distinct facility locations.</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex items-start gap-4">
          <div className="p-3 bg-green-500/20 text-green-400 rounded-lg"><FileText size={24} /></div>
          <div>
            <h3 className="font-bold text-lg">Action Portal</h3>
            <p className="text-slate-400 text-sm mt-1">Generate automated PDF complaints locally to send to the UN and HRCs.</p>
          </div>
        </div>
      </div>

      <section className="w-full max-w-6xl flex-1 min-h-[500px] border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur text-sm px-4 py-2 rounded-md border border-slate-700">
          <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-red-600"></span> Public Verified</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 opacity-60"></span> Heatmap Aggregated</div>
        </div>
        <Map />
      </section>
    </div>
  );
}
