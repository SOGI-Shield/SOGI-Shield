import { Shield, Lock, Globe2, FileText, AlertCircle, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6">
          About SOGI-Shield
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          A secure, zero-touch platform dedicated to global LGBTQ+ and non-binary human rights reporting, documentation, and institutional accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
        <div>
          <h2 className="text-3xl font-bold mb-4 text-white">Documentation as Resistance</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            Across the globe, state-sanctioned discrimination, unlicensed "conversion" practices, and medical misconduct against sexual orientation and gender identity (SOGI) minorities often go undocumented. SOGI-Shield exists to map these human rights violations without putting victims at risk.
          </p>
          <p className="text-slate-300 leading-relaxed mb-6">
            By acting as a decentralized aggregator, we empower activists, NGOs, and the UN Human Rights Council to identify crisis hotspots and hold institutions accountable.
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20"></div>
          <div className="relative bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <EyeOff className="text-indigo-400" /> Privacy First
            </h3>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>No Tracking:</strong> We do not log IP addresses, browser fingerprints, or user agents.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>No Accounts:</strong> Submission requires no email, password, or identifiable data.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Local Processing:</strong> Features like PDF generation happen entirely in your browser.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-10 text-center text-white">How the System Works</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(99,102,241,0.2)]">
          <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <Globe2 size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">1. Heatmap Aggregation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unverified reports or those lacking public evidence are stripped of specific facility details. They are anonymously aggregated into a regional heatmap (orange markers) to safely identify crisis zones while protecting the reporter's identity.
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(220,38,38,0.2)]">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6">
            <Shield size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">2. Public Verification</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our zero-touch system automatically verifies reports that contain legitimate links to public evidence (news articles, court documents). These appear on the map as precise red markers, exposing the specific facilities involved.
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-xl transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(148,163,184,0.2)]">
          <div className="w-14 h-14 bg-slate-600/30 text-slate-300 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">3. Institutional Neglect</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            If official authorities fail to investigate a filed complaint, the reporter can use their secure tracking code to flag the case as "Action Ignored." The marker turns grey, publicly mapping institutional failure and negligence.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <Lock className="mx-auto text-indigo-400 mb-6" size={48} />
        <h2 className="text-3xl font-bold text-white mb-4">Open Source & Secure</h2>
        <p className="text-slate-300 max-w-2xl mx-auto mb-8">
          SOGI-Shield is licensed under the GNU General Public License v3.0. We believe the tools for human rights defense should belong to everyone. You are free to inspect the code, host your own instance, or contribute to our mission.
        </p>
        <Link 
          href="/report" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]"
        >
          File an Incident Report
        </Link>
      </div>
    </div>
  );
}
