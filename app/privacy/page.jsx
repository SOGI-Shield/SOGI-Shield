import React from 'react';
import { Shield, Lock, EyeOff, FileText, Server, AlertTriangle, MapPin, Navigation, ExternalLink, FileCode } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | SOGI-Shield',
  description: 'Our strict privacy, zero-touch, and no-logging policies.',
};

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl relative z-10">
      <div className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-linear-to-r from-coral via-iris to-mint drop-shadow-[0_0_20px_rgba(251,78,119,0.3)]">Privacy Policy</h1>
        <p className="text-xl text-slate-300">
          Last updated: October 2026 (Version 1.1.0)
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-400">
          <span>Repository Policy Document:</span>
          <a
            href="https://github.com/Shubham-hahh/SOGI-Shield/blob/main/PRIVACY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mint hover:underline inline-flex items-center gap-1 font-mono"
          >
            PRIVACY.md <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-coral/40 rounded-3xl p-8 mb-12 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-coral"></div>
        <div className="flex gap-4 items-start">
          <AlertTriangle className="w-8 h-8 shrink-0 text-coral mt-1 drop-shadow-[0_0_8px_rgba(251,78,119,0.6)]" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Core Principle</h3>
            <p className="text-slate-300 leading-relaxed text-lg">
              SOGI-Shield is built for the safety of marginalized communities. 
              We operate under a strict &ldquo;Zero-Touch&rdquo; and &ldquo;Zero-Logging&rdquo; policy. We do not want your personal data.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10 relative z-10">
        
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <EyeOff className="w-6 h-6 text-mint" />
            1. What We Don&apos;t Collect
          </h2>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
            <ul className="list-none space-y-4 text-slate-300">
              <li className="flex items-start gap-3"><span className="text-mint mt-1 font-bold">✕</span> <span><strong className="text-white">No IP Addresses:</strong> We do not log, store, or transmit your IP address.</span></li>
              <li className="flex items-start gap-3"><span className="text-mint mt-1 font-bold">✕</span> <span><strong className="text-white">No User Accounts:</strong> There is no registration, login, or authentication system.</span></li>
              <li className="flex items-start gap-3"><span className="text-mint mt-1 font-bold">✕</span> <span><strong className="text-white">No Tracking Cookies:</strong> We do not use third-party analytics (like Google Analytics) or marketing trackers.</span></li>
              <li className="flex items-start gap-3"><span className="text-mint mt-1 font-bold">✕</span> <span><strong className="text-white">No Fingerprinting:</strong> We do not collect browser fingerprints, user-agent strings, or device IDs.</span></li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Navigation className="w-6 h-6 text-iris" />
            2. Geolocation &amp; User Choice (Incident Sector Mapping)
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            SOGI-Shield collects location information <strong className="text-white">only upon explicit user request</strong> to assist in geoguessing and determining the general incident sector or country. Location is never gathered in the background or without clear affirmative intent.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div className="bg-black/40 border border-iris/40 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-iris font-bold text-sm uppercase tracking-wide">
                <Navigation className="w-4 h-4 text-iris" />
                <span>Explicit User Action Only</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your device coordinates are requested <em>only</em> when you manually click the <strong>&ldquo;Auto-Detect Location (Photon)&rdquo;</strong> button. The app never queries the browser geolocation API automatically.
              </p>
            </div>

            <div className="bg-black/40 border border-mint/40 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-mint font-bold text-sm uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-mint" />
                <span>Manual &amp; Offline Alternative</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                You can decline or bypass browser geolocation entirely. You may manually type your country and region, or select from over <strong>1,200+ verified cities &amp; districts</strong> using our built-in offline reference dataset.
              </p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl">
            <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">Reverse Geocoding via Photon</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              When you opt into auto-detection, coordinates are converted into administrative region and country labels via the privacy-preserving <strong>Photon API</strong> (powered by open-source OpenStreetMap data). Raw precise device coordinates are discarded once the regional sector is resolved.
            </p>
          </div>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-white" />
            3. Report Data, Storage, &amp; Anonymity
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            When you submit a report through SOGI-Shield, the data is heavily sanitized before it ever reaches our database.
          </p>
          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl mb-6 shadow-inner">
            <h3 className="font-bold text-white mb-2 uppercase tracking-wide text-sm">Where is Data Stored?</h3>
            <p className="text-slate-300 leading-relaxed">All submitted incident reports are securely stored in <strong>Google Cloud Firestore (Firebase)</strong>. Google Cloud complies with major global security standards. We do not maintain our own physical servers, ensuring that the infrastructure holding this sensitive data is protected by enterprise-grade security and encryption at rest.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 hover:border-coral/40 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-coral mb-2 uppercase tracking-wide text-sm">Public Verified Reports</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Reports submitted with valid public evidence links (news articles, official records) are visible on the public map with Coral Rose markers (#FB4E77). No personal identifier of the submitter is attached.</p>
            </div>
            <div className="bg-white/5 border border-white/10 hover:border-mint/40 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-mint mb-2 uppercase tracking-wide text-sm">Heatmap Aggregated</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Reports without verifiable public links are completely anonymized and reduced to purely geographic density data (Vivid Mint heatmaps #00D99D) to prevent triangulation of incidents.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-white" />
            4. Local Action Portal &amp; Templates
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Features such as the <strong className="text-white">Global Action Portal</strong> are designed for local preparation entirely within your browser. 
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 marker:text-mint">
            <li>The standardized legal complaint format is provided as a blank template.</li>
            <li>You copy the template directly to your own clipboard and fill it out locally on your device.</li>
            <li>Your sensitive narrative and contact details never touch SOGI-Shield servers when preparing these complaints.</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-coral" />
            5. Security Measures (Panic Button)
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Our application includes a &ldquo;Panic Button&rdquo; for immediate safety. Activating it will instantly:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 marker:text-coral">
            <li>Clear all local storage, session storage, and temporary state.</li>
            <li>Overwrite the browser history for the current session.</li>
            <li>Redirect you to an innocuous public website (e.g., Wikipedia).</li>
          </ul>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">6. Anti-Bot Protection</h2>
          <p className="text-slate-300 leading-relaxed">
            We utilize Cloudflare Turnstile to prevent automated spam. Turnstile is designed to verify human interaction without invasive data collection or CAPTCHAs that compromise privacy. SOGI-Shield does not share any user-identifiable data with Cloudflare.
          </p>
        </section>

        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg relative overflow-hidden text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-r from-coral/10 via-iris/10 to-mint/10 blur-[90px] pointer-events-none"></div>
          <h2 className="text-2xl font-bold text-white mb-4 relative z-10">7. Open Source Accountability &amp; Policy Document</h2>
          <p className="text-slate-300 leading-relaxed mb-6 relative z-10 max-w-2xl mx-auto">
            Because trust must be verified, SOGI-Shield is entirely open-source. Security researchers, activists, and developers can audit our codebase and privacy specifications at any time to verify our implementation.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <a
              href="https://github.com/Shubham-hahh/SOGI-Shield/blob/main/PRIVACY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold py-3 px-6 rounded-xl transition-all border border-mint/30 uppercase tracking-wider text-xs"
            >
              <FileCode className="w-4 h-4 text-mint" />
              <span>Read PRIVACY.md in Repository</span>
            </a>
            <a
              href="https://github.com/Shubham-hahh/SOGI-Shield"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/50 hover:bg-black/70 text-white font-bold py-3 px-6 rounded-xl transition-all border border-white/20 uppercase tracking-widest text-xs inline-flex items-center gap-2"
            >
              <span>Audit Source Code</span>
            </a>
            <Link
              href="/"
              className="bg-coral hover:opacity-95 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(251,78,119,0.4)] hover:shadow-[0_0_30px_rgba(251,78,119,0.6)] border border-coral/40 uppercase tracking-widest text-xs active:scale-95 inline-flex items-center"
            >
              Return to Safety
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
