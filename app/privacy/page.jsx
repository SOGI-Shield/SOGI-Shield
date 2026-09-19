import React from 'react';
import { Shield, Lock, EyeOff, FileText, Server, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | SOGI-Shield',
  description: 'Our strict privacy, zero-touch, and no-logging policies.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 sm:p-12 font-sans selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-rose-500 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl font-bold tracking-tight text-neutral-100">Privacy Policy</h1>
          </div>
          <p className="text-xl text-neutral-400">
            Last updated: September 19, 2026 (Version 1.0.0)
          </p>
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-200 flex gap-3 items-start">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <p>
              <strong>Core Principle:</strong> SOGI-Shield is built for the safety of marginalized communities. 
              We operate under a strict "Zero-Touch" and "Zero-Logging" policy. We do not want your personal data.
            </p>
          </div>
        </header>

        {/* Content Sections */}
        <div className="space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-100 flex items-center gap-2">
              <EyeOff className="w-6 h-6 text-indigo-400" />
              1. What We Don't Collect
            </h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <ul className="list-disc list-inside space-y-3 text-neutral-300">
                <li><strong className="text-neutral-100">No IP Addresses:</strong> We do not log, store, or transmit your IP address.</li>
                <li><strong className="text-neutral-100">No User Accounts:</strong> There is no registration, login, or authentication system.</li>
                <li><strong className="text-neutral-100">No Tracking Cookies:</strong> We do not use third-party analytics (like Google Analytics) or marketing trackers.</li>
                <li><strong className="text-neutral-100">No Fingerprinting:</strong> We do not collect browser fingerprints, user-agent strings, or device IDs.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              2. Report Data, Storage, & Anonymity
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              When you submit a report through SOGI-Shield, the data is heavily sanitized before it ever reaches our database.
            </p>
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl mb-4">
              <h3 className="font-medium text-emerald-300 mb-2">Where is Data Stored?</h3>
              <p className="text-sm text-neutral-400">All submitted incident reports are securely stored in <strong>Google Cloud Firestore (Firebase)</strong>. Google Cloud complies with major global security standards. We do not maintain our own physical servers, ensuring that the infrastructure holding this sensitive data is protected by enterprise-grade security and encryption at rest.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
                <h3 className="font-medium text-emerald-300 mb-2">Public Verified Reports</h3>
                <p className="text-sm text-neutral-400">Reports submitted with valid public evidence links (news articles, official records) are visible on the public map. No personal identifier of the submitter is attached.</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
                <h3 className="font-medium text-emerald-300 mb-2">Heatmap Aggregated</h3>
                <p className="text-sm text-neutral-400">Reports without verifiable public links are completely anonymized and reduced to purely geographic density data (heatmaps) to prevent triangulation of incidents.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-100 flex items-center gap-2">
              <Server className="w-6 h-6 text-amber-400" />
              3. Local Action Portal & Templates
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Features such as the <strong>Global Action Portal</strong> are designed for local preparation entirely within your browser. 
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-300 ml-4">
              <li>The standardized legal complaint format is provided as a blank template.</li>
              <li>You copy the template directly to your own clipboard and fill it out locally on your device.</li>
              <li>Your sensitive narrative and contact details never touch SOGI-Shield servers when preparing these complaints.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-100 flex items-center gap-2">
              <Lock className="w-6 h-6 text-cyan-400" />
              4. Security Measures (Panic Button)
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Our application includes a "Panic Button" for immediate safety. Activating it will instantly:
            </p>
            <ul className="list-disc list-inside space-y-2 text-neutral-300 ml-4">
              <li>Clear all local storage, session storage, and temporary state.</li>
              <li>Overwrite the browser history for the current session.</li>
              <li>Redirect you to an innocuous public website (e.g., Wikipedia).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-100">5. Anti-Bot Protection</h2>
            <p className="text-neutral-300 leading-relaxed">
              We utilize Cloudflare Turnstile to prevent automated spam. Turnstile is designed to verify human interaction without invasive data collection or CAPTCHAs that compromise privacy. SOGI-Shield does not share any user-identifiable data with Cloudflare.
            </p>
          </section>

          <section className="space-y-4 border-t border-neutral-800 pt-8 mt-8">
            <h2 className="text-2xl font-semibold text-neutral-100">6. Open Source Accountability</h2>
            <p className="text-neutral-300 leading-relaxed">
              Because trust must be verified, SOGI-Shield is entirely open-source. Security researchers, activists, and developers can audit our codebase at any time to verify that our privacy claims match our implementation.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="https://github.com/Shubham-hahh/SOGI-Shield" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg font-medium transition-colors border border-neutral-700">
                Audit the Source Code
              </a>
              <Link href="/" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors">
                Return to Safety
              </Link>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
