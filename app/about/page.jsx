import { Shield, Lock, Globe2, FileText, AlertCircle, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-16 relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          About SOGI-Shield
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          A secure, zero-touch platform dedicated to global LGBTQ+ and non-binary human rights reporting, documentation, and institutional accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24 relative z-10">
        <div>
          <h2 className="text-3xl font-bold mb-4 text-white">Documentation as Resistance</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            Across the globe, state-sanctioned discrimination, unlicensed "conversion" practices, and medical misconduct against sexual orientation, gender identity, expression, and sex characteristics (SOGIESC) minorities often go undocumented. SOGI-Shield exists to map these human rights violations without putting victims at risk.
          </p>
          <p className="text-slate-300 leading-relaxed mb-6">
            By acting as a decentralized aggregator, we empower activists, NGOs, and the UN Human Rights Council to identify crisis hotspots and hold institutions accountable.
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <EyeOff className="text-indigo-400" /> Privacy First
            </h3>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">✓</span>
                <span><strong>No Tracking:</strong> We do not log IP addresses, browser fingerprints, or user agents.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 mt-1 drop-shadow-[0_0_5px_rgba(129,140,248,0.8)]">✓</span>
                <span><strong>No Accounts:</strong> Submission requires no email, password, or identifiable data.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-400 mt-1 drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]">✓</span>
                <span><strong>Local Processing:</strong> Feature generation and report templating happen entirely in your browser.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-10 text-center text-white relative z-10">How the System Works</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 relative z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl transition-all hover:-translate-y-2 hover:bg-white/10 shadow-lg group">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-shadow">
            <Globe2 size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">1. Heatmap Aggregation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unverified reports or those lacking public evidence are stripped of specific facility details. They are anonymously aggregated into a regional heatmap (emerald markers) to safely identify crisis zones while protecting the reporter's identity.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl transition-all hover:-translate-y-2 hover:bg-white/10 shadow-lg group">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-shadow">
            <Shield size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">2. Public Verification</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our zero-touch system automatically verifies reports that contain legitimate links to public evidence (news articles, court documents). These appear on the map as precise red markers, exposing the specific facilities involved.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl transition-all hover:-translate-y-2 hover:bg-white/10 shadow-lg group">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-500/20 to-slate-400/20 border border-slate-500/20 text-slate-300 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-[0_0_15px_rgba(148,163,184,0.4)] transition-shadow">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">3. Institutional Neglect</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            If official authorities fail to investigate a filed complaint, the reporter can use their secure tracking code to flag the case as "Action Ignored." The marker turns grey, publicly mapping institutional failure and negligence.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-cyan-600/10 via-indigo-600/10 to-pink-600/10 blur-[80px] pointer-events-none"></div>
        <Lock className="mx-auto text-indigo-400 mb-6 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" size={48} />
        <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Open Source & Secure</h2>
        <p className="text-slate-300 max-w-2xl mx-auto mb-10 relative z-10">
          SOGI-Shield is licensed under the GNU General Public License v3.0. We believe the tools for human rights defense should belong to everyone. You are free to inspect the code, host your own instance, or contribute to our mission.
        </p>
        <Link 
          href="/report" 
          className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-4 px-10 rounded-full transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] border border-white/20 relative z-10"
        >
          File an Incident Report
        </Link>
      </div>
    </div>
  );
}
