"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isMockMode } from "@/lib/firebase";
import Link from "next/link";

export default function HomepageMetrics() {
  const [stats, setStats] = useState({ total: 0, verified: 0, ignored: 0, heatmap: 0 });

  useEffect(() => {
    if (isMockMode) {
      import('@/src/data/mockReports.json').then(m => {
        const reports = m.default || m;
        const newStats = { total: 0, verified: 0, ignored: 0, heatmap: 0 };
        reports.forEach(report => {
          newStats.total++;
          if (report.status === "PUBLIC_VERIFIED") newStats.verified++;
          if (report.status === "ACTION_IGNORED") newStats.ignored++;
          if (report.status === "HEATMAP_AGGREGATED") newStats.heatmap++;
        });
        setStats(newStats);
      }).catch(e => console.error(e));
      return;
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
      const q = query(collection(db, "reports"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newStats = { total: 0, verified: 0, ignored: 0, heatmap: 0 };
        snapshot.docs.forEach(doc => {
          const report = doc.data();
          newStats.total++;
          if (report.status === "PUBLIC_VERIFIED") newStats.verified++;
          if (report.status === "ACTION_IGNORED") newStats.ignored++;
          if (report.status === "HEATMAP_AGGREGATED") newStats.heatmap++;
        });
        setStats(newStats);
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <section className="w-full max-w-6xl mt-8 mb-24 px-4 sm:px-0">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-10 relative z-10">
          <span className="text-indigo-400">{stats.total.toLocaleString()}+</span> Incidents Documented Globally
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 relative z-10 max-w-4xl mx-auto">
          <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl backdrop-blur shadow-inner">
            <div className="text-4xl font-bold text-red-500 mb-2">{stats.verified.toLocaleString()}</div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">Verified Cases</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl backdrop-blur shadow-inner">
            <div className="text-4xl font-bold text-slate-300 mb-2">{stats.ignored.toLocaleString()}</div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">Action Ignored</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl backdrop-blur shadow-inner">
            <div className="text-4xl font-bold text-orange-500 mb-2">{stats.heatmap.toLocaleString()}</div>
            <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">Heatmap Aggregated</div>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto border-t border-slate-800 pt-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Data is our shield. Silence is our enemy.
          </h3>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Every story mapped is an institution held accountable. Join us in building a permanent, immutable record for global human rights.
          </p>
          <Link 
            href="/report" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] text-lg"
          >
            File an Incident Report
          </Link>
        </div>
      </div>
    </section>
  );
}
