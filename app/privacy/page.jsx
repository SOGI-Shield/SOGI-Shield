import React from 'react';
import {
  Shield,
  Lock,
  EyeOff,
  FileText,
  Server,
  AlertTriangle,
  MapPin,
  Navigation,
  ExternalLink,
  FileCode,
  Binary,
  Cpu,
  FileCheck2
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | SOGI-Shield',
  description: 'Our strict privacy, zero-touch, client-side compression, and no-logging policies.',
};

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-4xl relative z-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-coral via-iris to-mint drop-shadow-[0_0_20px_rgba(251,78,119,0.3)]">
          Privacy Policy
        </h1>
        <p className="text-base sm:text-lg text-slate-300">
          Last updated: October 2026 (Version 1.2.0)
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

      <div className="bg-slate-900/60 backdrop-blur-xl border border-coral/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-coral"></div>
        <div className="flex gap-4 items-start">
          <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-coral mt-1 drop-shadow-[0_0_8px_rgba(251,78,119,0.6)]" />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wide">Core Principle</h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              SOGI-Shield is built for the safety of marginalized communities.
              We operate under a strict &ldquo;Zero-Touch&rdquo; and &ldquo;Zero-Logging&rdquo; architecture. We do not want, collect, or store your personal identity.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 sm:space-y-10 relative z-10">

        {/* 1. What We Don't Collect */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <EyeOff className="w-6 h-6 text-mint shrink-0" />
            1. What We NEVER Collect
          </h2>
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 sm:p-6">
            <ul className="list-none space-y-3.5 text-slate-300 text-sm sm:text-base">
              <li className="flex items-start gap-3"><span className="text-mint mt-0.5 font-bold">✕</span> <span><strong className="text-white">No IP Addresses:</strong> We do not log, retain, or transmit user IP addresses across edge workers or databases.</span></li>
              <li className="flex items-start gap-3"><span className="text-mint mt-0.5 font-bold">✕</span> <span><strong className="text-white">No User Accounts:</strong> There is no registration, password system, phone number requirement, or authentication state.</span></li>
              <li className="flex items-start gap-3"><span className="text-mint mt-0.5 font-bold">✕</span> <span><strong className="text-white">No Tracking Cookies or Analytics:</strong> Zero marketing pixels, zero behavioral cookies, and zero Google/Meta tracking scripts.</span></li>
              <li className="flex items-start gap-3"><span className="text-mint mt-0.5 font-bold">✕</span> <span><strong className="text-white">No Device Fingerprinting:</strong> We do not probe browser canvas, audio contexts, battery levels, or unique hardware identifiers.</span></li>
            </ul>
          </div>
        </section>

        {/* 2. Selective Hybrid Compression */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-iris/30 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-iris shrink-0" />
            2. Client-Side Selective Hybrid Compression (<code className="text-sm font-mono text-iris px-1.5 py-0.5 bg-iris/10 rounded">c_data</code>)
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
            To prevent transit analysis and database narrative exposure, SOGI-Shield compresses heavy incident details client-side before any data leaves your browser.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className="bg-black/40 border border-iris/40 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-iris font-bold text-xs sm:text-sm uppercase tracking-wide">
                <Binary className="w-4 h-4 text-iris shrink-0" />
                <span>In-Browser Stream Compression</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Detailed narratives, authority notes, and witness accounts are compressed directly into an opaque binary Base64 payload (<code className="text-iris font-mono text-xs">c_data</code>) using the native browser <code className="text-slate-200 font-mono text-xs">CompressionStream(&apos;gzip&apos;)</code> API. Raw narrative strings are never sent over the wire in plain text.
              </p>
            </div>

            <div className="bg-black/40 border border-mint/40 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-mint font-bold text-xs sm:text-sm uppercase tracking-wide">
                <Lock className="w-4 h-4 text-mint shrink-0" />
                <span>Quarantined Metadata Keys</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Only non-identifying operational keys (coarse coordinates, Plus Code, incident category, and verification status) remain plaintext. This allows Leaflet map queries and Firestore security rules to operate without exposing narrative evidence to server snooping.
              </p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-xs sm:text-sm text-slate-400">
            <strong className="text-slate-200">Sub-2ms Decompression:</strong> When viewing an incident preview or tracking a report, your browser decompresses <code className="text-iris font-mono text-xs">c_data</code> locally in under 2ms using <code className="text-slate-200 font-mono text-xs">DecompressionStream</code>, leaving zero uncompressed copies on external servers.
          </div>
        </section>

        {/* 3. Geolocation & Plus Codes */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Navigation className="w-6 h-6 text-mint shrink-0" />
            3. Geolocation, Plus Codes &amp; User Choice
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
            SOGI-Shield collects location information <strong className="text-white">only upon explicit user request</strong> to assist in geoguessing and determining the general incident sector or country. Location is never gathered passively or in the background.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className="bg-black/40 border border-iris/40 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-iris font-bold text-xs sm:text-sm uppercase tracking-wide">
                <Navigation className="w-4 h-4 text-iris shrink-0" />
                <span>Affirmative Action Only</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Device GPS is requested <em>only</em> if you tap &ldquo;Auto-Detect Location (Photon)&rdquo;. Coordinates are resolved to coarse administrative sectors via the privacy-respecting Photon reverse geocoder (OpenStreetMap).
              </p>
            </div>

            <div className="bg-black/40 border border-mint/40 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-mint font-bold text-xs sm:text-sm uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-mint shrink-0" />
                <span>Offline Reference &amp; Plus Codes</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                You can decline browser geolocation completely. Type manually or choose from <strong>1,200+ offline verified cities</strong>. Incidents are mapped via coarse <strong>Plus Codes</strong> (e.g., <code className="text-mint font-mono text-xs">7MJCQ966+22</code>) to eliminate pinpoint residential triangulation.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Report Data & Storage */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-white shrink-0" />
            4. Report Storage &amp; Anonymity Protection
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
            Submitted incident records are stored in Google Cloud Firestore with end-to-end TLS 1.3 encryption and enterprise encryption at rest. Database writes are anonymous client writes governed by strict rules in <code className="text-slate-300 font-mono text-xs">firestore.rules</code>:
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className="bg-white/5 border border-white/10 hover:border-coral/40 p-5 rounded-2xl transition-colors">
              <h3 className="font-bold text-coral mb-2 uppercase tracking-wide text-xs sm:text-sm">Public Verified Reports</h3>
              <p className="text-slate-400 leading-relaxed text-xs sm:text-sm">Reports supported by public verification links (press reports, legal dockets) appear on the interactive map with Coral Rose markers. No submitter IP or identity is ever recorded.</p>
            </div>
            <div className="bg-white/5 border border-white/10 hover:border-mint/40 p-5 rounded-2xl transition-colors">
              <h3 className="font-bold text-mint mb-2 uppercase tracking-wide text-xs sm:text-sm">Heatmap Aggregation</h3>
              <p className="text-slate-400 leading-relaxed text-xs sm:text-sm">Reports lacking public corroboration are coarsened and merged into wide regional density layers (Vivid Mint) to ensure individuals cannot be pinpointed or targeted.</p>
            </div>
          </div>
        </section>

        {/* 5. In-Browser Action Portal */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-white shrink-0" />
            5. In-Browser Action Portal &amp; Ephemeral Processing
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4 text-sm sm:text-base">
            The <strong className="text-white">Global Action Portal</strong> provides UN OHCHR and national human rights complaint drafting entirely in client-side memory:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 marker:text-mint text-xs sm:text-sm leading-relaxed">
            <li>Complaint PDFs are assembled directly in your browser using <code className="text-slate-300 font-mono text-xs">jsPDF</code>.</li>
            <li>Victim narratives, legal arguments, and contact points never touch SOGI-Shield servers or Firebase.</li>
            <li>Community caution graphics are generated client-side on HTML5 Canvas and saved directly to your local file system for encrypted peer-to-peer sharing.</li>
          </ul>
        </section>

        {/* 6. Panic Button */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-coral shrink-0" />
            6. Emergency Panic Button
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4 text-sm sm:text-base">
            Our application includes an Emergency Panic Button accessible across all viewports. Triggering it immediately:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2 marker:text-coral text-xs sm:text-sm leading-relaxed">
            <li>Purges all <code className="text-slate-300 font-mono text-xs">localStorage</code>, <code className="text-slate-300 font-mono text-xs">sessionStorage</code>, and volatile React state.</li>
            <li>Overwrites the browser history entry for the current tab.</li>
            <li>Performs an immediate hard redirect to an innocuous educational website (e.g., Wikipedia).</li>
          </ul>
        </section>

        {/* 7. Anti-Bot Defense */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">7. Anti-Bot Defense (Cloudflare Turnstile)</h2>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            We employ Cloudflare Turnstile to prevent automated denial-of-service and spam attacks. Turnstile evaluates visitor interaction without cross-site tracking cookies, behavioral ad profiles, or intrusive interactive CAPTCHAs. SOGI-Shield transmits no user-identifying report data to Cloudflare.
          </p>
        </section>

        {/* 8. Open Source Accountability */}
        <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-coral/10 via-iris/10 to-mint/10 blur-[90px] pointer-events-none"></div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 relative z-10">8. Open Source Accountability &amp; Policy Document</h2>
          <p className="text-slate-300 leading-relaxed mb-6 relative z-10 max-w-2xl mx-auto text-sm sm:text-base">
            In human rights and digital defense, trust must be verifiable. SOGI-Shield is completely open-source. Anyone can inspect our code, review security headers, and audit our zero-logging infrastructure.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 relative z-10">
            <a
              href="https://github.com/Shubham-hahh/SOGI-Shield/blob/main/PRIVACY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl transition-all border border-mint/30 uppercase tracking-wider text-xs"
            >
              <FileCode className="w-4 h-4 text-mint shrink-0" />
              <span>Read PRIVACY.md in Repository</span>
            </a>
            <a
              href="https://github.com/SOGI/SOGI-Shield"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/50 hover:bg-black/70 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl transition-all border border-white/20 uppercase tracking-widest text-xs inline-flex items-center gap-2"
            >
              <span>Audit Source Code</span>
            </a>
            <Link
              href="https://github.com/SOGI-Shield/SOGI-Shield"
              className="bg-coral hover:opacity-95 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(251,78,119,0.4)] hover:shadow-[0_0_30px_rgba(251,78,119,0.6)] border border-coral/40 uppercase tracking-widest text-xs active:scale-95 inline-flex items-center"
            >
              Return to Safety
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
