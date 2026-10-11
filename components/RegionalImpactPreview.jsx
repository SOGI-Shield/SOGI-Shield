"use client";

import dynamic from "next/dynamic";
import { Radio, Users, MapPin, Eye } from "lucide-react";

const MiniImpactMap = dynamic(() => import("./MiniImpactMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 sm:h-56 bg-slate-900/80 animate-pulse rounded-2xl flex items-center justify-center border border-white/10 text-slate-400 text-xs font-mono">
      Initializing regional radar feed...
    </div>
  ),
});

export default function RegionalImpactPreview({ report }) {
  const { region, country, lat, lng, category, status } = report || {};

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

      <div>
        {/* Collective Impact Notification */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex-shrink-0 mt-0.5">
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Grid Updated
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
              Your ping updated the local cluster.
            </h3>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
              You just alerted community members and allies passing through this area.
            </p>
          </div>
        </div>

        {/* Location & Sector Tag */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 bg-black/40 border border-white/5 p-3 rounded-xl mb-4">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <MapPin size={14} />
            <span>{region || "Sector"}, {country}</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{category}</span>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-emerald-400 font-mono">
            <Users size={13} />
            <span>Regional Watch Active</span>
          </div>
        </div>

        {/* Mini Impact Map */}
        {lat && lng ? (
          <div className="mb-3">
            <MiniImpactMap lat={lat} lng={lng} category={category} status={status} />
          </div>
        ) : (
          <div className="h-28 bg-slate-900/60 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 text-xs mb-3">
            Sector coordinates anonymized within regional grid
          </div>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Eye size={14} className="text-indigo-400" /> Visible on public safety heatmap
        </span>
        <a
          href={`/?lat=${lat || 20}&lng=${lng || 0}&zoom=11`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline font-medium"
        >
          Open Global Map ↗
        </a>
      </div>
    </div>
  );
}
