import React from 'react';
import { Shield, Lock, EyeOff, FileText, Server, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | SOGI-Shield',
  description: 'Our strict privacy, zero-touch, and no-logging policies.',
};

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl relative z-10">
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Shield className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">Privacy Policy</h1>
        <p className="text-xl text-slate-400">
          Last updated: September 19, 2026 (Version 1.0.0)
        </p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 mb-12 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-400 to-pink-500"></div>
        <div className="flex gap-4 items-start">
          <AlertTriangle className="w-8 h-8 shrink-0 text-rose-400 mt-1 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Core Principle</h3>
            <p className="text-slate-300 leading-relaxed text-lg">
              SOGI-Shield is built for the safety of marginalized communities. 
              We operate under a strict "Zero-Touch" and "Zero-Logging" policy. We do not want your personal data.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10 relative z-10">
        
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <EyeOff className="w-6 h-6 text-cyan-400" />
            1. What We Don't Collect
          </h2>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <ul className="list-none space-y-4 text-slate-300">
              <li className="flex items-start gap-3"><span className="text-cyan-400 mt-1 font-bold">✕</span> <span><strong className="text-white">No IP Addresses:</strong> We do not log, store, or transmit your IP address.</span></li>
              <li className="flex items-start gap-3"><span className="text-cyan-400 mt-1 font-bold">✕</span> <span><strong className="text-white">No User Accounts:</strong> There is no registration, login, or authentication system.</span></li>
              <li className="flex items-start gap-3"><span className="text-cyan-400 mt-1 font-bold">✕</span> <span><strong className="text-white">No Tracking Cookies:</strong> We do not use third-party analytics (like Google Analytics) or marketing trackers.</span></li>
              <li className="flex items-start gap-3"><span className="text-cyan-400 mt-1 font-bold">✕</span> <span><strong className="text-white">No Fingerprinting:</strong> We do not collect browser fingerprints, user-agent strings, or device IDs.</span></li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-emerald-400" />
            2. Report Data, Storage, & Anonymity
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            When you submit a report through SOGI-Shield, the data is heavily sanitized before it ever reaches our database.
          </p>
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl mb-6 shadow-inner">
            <h3 className="font-bold text-emerald-300 mb-2 uppercase tracking-wide text-sm">Where is Data Stored?</h3>
            <p className="text-slate-300 leading-relaxed">All submitted incident reports are securely stored in <strong>Google Cloud Firestore (Firebase)</strong>. Google Cloud complies with major global security standards. We do not maintain our own physical servers, ensuring that the infrastructure holding this sensitive data is protected by enterprise-grade security and encryption at rest.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-rose-400 mb-2 uppercase tracking-wide text-sm">Public Verified Reports</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Reports submitted with valid public evidence links (news articles, official records) are visible on the public map. No personal identifier of the submitter is attached.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-emerald-400 mb-2 uppercase tracking-wide text-sm">Heatmap Aggregated</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Reports without verifiable public links are completely anonymized and reduced to purely geographic density data (heatmaps) to prevent triangulation of incidents.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-amber-400" />
            3. Local Action Portal & Templates
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Features such as the <strong className="text-white">Global Action Portal</strong> are designed for local preparation entirely within your browser. 
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 marker:text-amber-500">
            <li>The standardized legal complaint format is provided as a blank template.</li>
            <li>You copy the template directly to your own clipboard and fill it out locally on your device.</li>
            <li>Your sensitive narrative and contact details never touch SOGI-Shield servers when preparing these complaints.</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-pink-400" />
            4. Security Measures (Panic Button)
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Our application includes a "Panic Button" for immediate safety. Activating it will instantly:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 marker:text-pink-500">
            <li>Clear all local storage, session storage, and temporary state.</li>
            <li>Overwrite the browser history for the current session.</li>
            <li>Redirect you to an innocuous public website (e.g., Wikipedia).</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">5. Anti-Bot Protection</h2>
          <p className="text-slate-300 leading-relaxed">
            We utilize Cloudflare Turnstile to prevent automated spam. Turnstile is designed to verify human interaction without invasive data collection or CAPTCHAs that compromise privacy. SOGI-Shield does not share any user-identifiable data with Cloudflare.
          </p>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-3xl shadow-lg relative overflow-hidden text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 blur-[80px] pointer-events-none"></div>
          <h2 className="text-2xl font-bold text-white mb-4 relative z-10">6. Open Source Accountability</h2>
          <p className="text-slate-300 leading-relaxed mb-8 relative z-10 max-w-2xl mx-auto">
            Because trust must be verified, SOGI-Shield is entirely open-source. Security researchers, activists, and developers can audit our codebase at any time to verify that our privacy claims match our implementation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <a href="https://github.com/Shubham-hahh/SOGI-Shield" target="_blank" rel="noopener noreferrer" className="bg-black/50 hover:bg-black/70 text-white font-bold py-3 px-8 rounded-xl transition-all border border-white/20 uppercase tracking-widest text-sm">
              Audit the Source Code
            </a>
            <Link href="/" className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:from-pink-700 active:to-rose-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] border border-rose-400/30 uppercase tracking-widest text-sm">
              Return to Safety
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
