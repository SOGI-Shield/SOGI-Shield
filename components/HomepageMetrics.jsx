"use client";

import { useEffect, useState } from "react";
import { subscribeReports, fetchAllReports, initBackgroundPoller } from "@/lib/reportsCache";
import Link from "next/link";

export default function HomepageMetrics() {
  const [stats, setStats] = useState({ total: 0, verified: 0, ignored: 0, heatmap: 0 });

  const calculateStats = (reports) => {
    if (!reports || !Array.isArray(reports)) return;
    const newStats = { total: 0, verified: 0, ignored: 0, heatmap: 0 };
    reports.forEach(report => {
      newStats.total++;
      if (report.status === "PUBLIC_VERIFIED") newStats.verified++;
      if (report.status === "ACTION_IGNORED") newStats.ignored++;
      if (report.status === "HEATMAP_AGGREGATED") newStats.heatmap++;
    });
    setStats(newStats);
  };

  useEffect(() => {
    initBackgroundPoller();
    const unsubscribe = subscribeReports((reports) => {
      calculateStats(reports);
    });
    fetchAllReports();
    return () => unsubscribe();
  }, []);

  return (
    <section className="w-full max-w-6xl mt-8 mb-24 px-4 sm:px-0 relative z-10">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-linear-to-r from-[#584BE0]/15 via-[#FB4E77]/10 to-[#00D99D]/15 blur-[120px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-10 relative z-10">
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FB4E77] via-[#584BE0] to-[#00D99D]">{stats.total.toLocaleString()}+</span> Incidents Documented Globally
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 relative z-10 max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 hover:border-[#FB4E77]/40 p-6 rounded-2xl backdrop-blur-md shadow-lg hover:bg-white/10 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-[#FB4E77] mb-2 drop-shadow-[0_0_12px_rgba(251,78,119,0.5)]">{stats.verified.toLocaleString()}</div>
            <div className="text-sm text-slate-300 font-bold uppercase tracking-widest">Verified Cases</div>
          </div>
          <div className="bg-white/5 border border-white/10 hover:border-[#584BE0]/40 p-6 rounded-2xl backdrop-blur-md shadow-lg hover:bg-white/10 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-slate-300 mb-2 drop-shadow-[0_0_10px_rgba(203,213,225,0.3)]">{stats.ignored.toLocaleString()}</div>
            <div className="text-sm text-slate-300 font-bold uppercase tracking-widest">Action Ignored</div>
          </div>
          <div className="bg-white/5 border border-white/10 hover:border-[#00D99D]/40 p-6 rounded-2xl backdrop-blur-md shadow-lg hover:bg-white/10 transition-all">
            <div className="text-3xl sm:text-4xl font-bold text-[#00D99D] mb-2 drop-shadow-[0_0_12px_rgba(0,217,157,0.5)]">{stats.heatmap.toLocaleString()}</div>
            <div className="text-sm text-slate-300 font-bold uppercase tracking-widest">Heatmap Aggregated</div>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto border-t border-white/10 pt-10 mt-4">
          <h3 className="text-xl sm:text-3xl font-bold text-white mb-4">
            Data is our shield. Silence is our enemy.
          </h3>
          <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
            Every story mapped is an institution held accountable. Join us in building a permanent, immutable record for global human rights.
          </p>
          <Link 
            href="/report" 
            className="inline-block bg-linear-to-r from-[#FB4E77] via-[#584BE0] to-[#00D99D] hover:opacity-95 text-white font-bold py-4 px-8 sm:px-10 rounded-full transition-all shadow-[0_0_25px_rgba(251,78,119,0.4)] hover:shadow-[0_0_35px_rgba(0,217,157,0.5)] text-base sm:text-lg border border-white/20 active:scale-[0.98]"
          >
            File an Incident Report
          </Link>
        </div>
      </div>
    </section>
  );
}
