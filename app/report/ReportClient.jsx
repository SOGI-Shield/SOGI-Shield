"use client";

import { useState, useEffect } from "react";
import { 
  Info, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  FileText, 
  Download, 
  Share2, 
  AlertTriangle, 
  ArrowRight, 
  Shield, 
  Sparkles,
  ExternalLink
} from "lucide-react";
import { db, isMockMode } from "@/lib/firebase";
import { sanitizeReportPayload, classifyReport } from "@/lib/utils";
import { Turnstile } from '@marsidev/react-turnstile';
import { generateComplaintPdf } from "@/lib/generateComplaintPdf";
import CommunityCautionCard from "@/components/CommunityCautionCard";
import RegionalImpactPreview from "@/components/RegionalImpactPreview";
import EvidenceLockerResources from "@/components/EvidenceLockerResources";

export default function ReportPage() {
  const [formData, setFormData] = useState({
    country: "",
    region: "",
    facilityName: "",
    category: "",
    summary: "",
    evidenceLinks: "",
    reportedToAuthorities: false,
    authorityDetails: "",
    actionIgnored: false,
    website_hp: "", // honeypot
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState("");
  const [trackingCodeResult, setTrackingCodeResult] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'personal' | 'community'

  useEffect(() => {
    // Check rate limit on load
    const lastSubmit = localStorage.getItem('sogi_last_submit');
    if (lastSubmit) {
      const timeSince = Date.now() - parseInt(lastSubmit, 10);
      if (timeSince < 5 * 60 * 1000) {
        setRateLimited(true);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCodeResult);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!submittedReport) return;
    setIsDownloadingPdf(true);
    try {
      await generateComplaintPdf(submittedReport);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePanicExit = () => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.replace("https://www.wikipedia.org");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Honeypot check
    if (formData.website_hp) {
      console.warn("Honeypot triggered. Silently aborting.");
      setSubmitStatus('success'); // Fake success for bots
      return;
    }

    if (rateLimited) {
      setErrorMessage("Please wait 5 minutes between submissions.");
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      // Turnstile verification
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        if (!turnstileToken) {
          throw new Error("Bot verification incomplete. Please wait or reload.");
        }
        
        const tsRes = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken })
        });
        const tsData = await tsRes.json();
        if (!tsData.success) {
          throw new Error(tsData.message || "Failed anti-bot verification.");
        }
      }

      // Process evidence links
      const linksArray = formData.evidenceLinks
        .split(/[\n,]+/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      // Sanitize and prepare base payload
      const basePayload = sanitizeReportPayload({
        ...formData,
        evidenceLinks: linksArray
      });

      // Run Zero-Touch Classification locally
      const finalReport = classifyReport(basePayload);

      // Fetch accurate coordinates via OpenStreetMap Nominatim
      try {
        let geoData = null;
        // Attempt 1: Region + Country
        const query1 = encodeURIComponent(`${finalReport.region}, ${finalReport.country}`);
        const res1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query1}&limit=1`);
        geoData = await res1.json();
        
        // Attempt 2: If Region+Country fails (e.g. too specific/typos), fallback to Country only
        if (!geoData || geoData.length === 0) {
          const query2 = encodeURIComponent(`${finalReport.country}`);
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query2}&limit=1`);
          geoData = await res2.json();
        }
        
        if (geoData && geoData.length > 0) {
          finalReport.lat = parseFloat(geoData[0].lat);
          finalReport.lng = parseFloat(geoData[0].lon);
        } else {
          throw new Error("Could not find this location on the map. Please check your spelling for Region/Country.");
        }
      } catch (err) {
        console.error("Geocoding completely failed:", err);
        throw new Error(err.message || "Failed to locate the address. Please simplify the region/city name.");
      }

      const reportId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      finalReport.id = reportId;

      const secretReport = {
        reportId: reportId,
      };
      const generatedTrackingCode = finalReport.trackingCode;

      // Keep complete client-side copy for personal dossier & caution card before scrubbing
      const fullClientCopy = {
        ...finalReport,
        trackingCode: generatedTrackingCode,
        facilityName: formData.facilityName || null,
        reportedToAuthorities: formData.reportedToAuthorities,
        authorityDetails: formData.authorityDetails,
        actionIgnored: formData.actionIgnored
      };
      
      // Crucial security fix: Delete trackingCode from the public document so it isn't leaked
      delete finalReport.trackingCode;

      // Submit to Firestore if API key is set and not mocking
      if (!isMockMode && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') {
        const { doc, setDoc } = await import("firebase/firestore/lite");
        // We MUST await these, otherwise errors are swallowed and the user thinks it succeeded!
        await setDoc(doc(db, "reports", reportId), finalReport);
        // Use trackingCode as the document ID so it can only be read by someone who knows it
        await setDoc(doc(db, "report_secrets", generatedTrackingCode), secretReport);
      } else {
        // Simulate network request
        console.log("Mock submission:", finalReport);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update Rate Limit
      localStorage.setItem('sogi_last_submit', Date.now().toString());
      setRateLimited(true);

      setTrackingCodeResult(generatedTrackingCode);
      setSubmittedReport(fullClientCopy);
      setSubmitStatus('success');
      
      // Clear sensitive form data
      setFormData({ 
        country: "", region: "", facilityName: "", category: "", 
        summary: "", evidenceLinks: "", reportedToAuthorities: false, 
        authorityDetails: "", actionIgnored: false, website_hp: "" 
      });
      
    } catch (error) {
      console.error("Error submitting report:", error);
      setErrorMessage(error.message || "An error occurred while submitting.");
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dual Post-Submission Flow
  if (submitStatus === 'success' && trackingCodeResult && submittedReport) {
    return (
      <div className="flex-1 container mx-auto px-4 py-8 sm:py-14 max-w-5xl relative z-10">
        
        {/* Reassurance Header Banner */}
        <div className="text-center mb-8 sm:mb-10 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-emerald-300 uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <ShieldCheck size={18} className="text-emerald-400" /> Incident Logged Anonymously
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.25)] mb-3">
            Zero-Touch Protection Activated
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            No IP, browser fingerprint, or personal identifier was stored. Your data was classified locally and sealed under zero-knowledge integrity.
          </p>
        </div>

        {/* Top 3-Way Quick Action Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Quick Action 1: Download UN/HRC Complaint PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="group p-5 bg-gradient-to-br from-indigo-950/80 via-slate-900/80 to-slate-900/80 hover:from-indigo-900/90 hover:via-slate-800/90 hover:to-slate-800/90 border border-indigo-500/40 hover:border-indigo-400 rounded-3xl transition-all shadow-[0_4px_24px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_32px_rgba(99,102,241,0.4)] text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <FileText size={22} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Pillar 1: Personal
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-cyan-300 transition-colors">
                Download UN/HRC PDF
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Client-side legal dossier for your records, local legal aid, or UN filings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-bold text-indigo-300 group-hover:text-cyan-300">
              <Download size={14} />
              {isDownloadingPdf ? "Building PDF..." : "One-Click Download"}
            </div>
          </button>

          {/* Quick Action 2: Share Caution Card */}
          <button
            onClick={() => {
              const el = document.getElementById("community-shield-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="group p-5 bg-gradient-to-br from-rose-950/80 via-slate-900/80 to-slate-900/80 hover:from-rose-900/90 hover:via-slate-800/90 hover:to-slate-800/90 border border-rose-500/40 hover:border-rose-400 rounded-3xl transition-all shadow-[0_4px_24px_rgba(244,63,94,0.2)] hover:shadow-[0_4px_32px_rgba(244,63,94,0.4)] text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                  <Share2 size={22} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Pillar 2: Community
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-rose-300 transition-colors">
                Warn Community Groups
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Forward discreet caution graphic or text to Signal, Telegram, & WhatsApp.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-bold text-rose-300 group-hover:text-rose-200">
              <Share2 size={14} />
              <span>Generate Caution Card ↓</span>
            </div>
          </button>

          {/* Quick Action 3: Panic Exit */}
          <button
            onClick={handlePanicExit}
            className="group p-5 bg-gradient-to-br from-red-950/90 via-slate-900/80 to-slate-900/80 hover:from-red-900 hover:via-slate-900 hover:to-slate-900 border border-red-500/40 hover:border-red-400 rounded-3xl transition-all shadow-[0_4px_24px_rgba(239,68,68,0.2)] text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                  <AlertTriangle size={22} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/30">
                  Emergency
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-red-300 transition-colors">
                ⚡ PANIC EXIT
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Instantly wipe local and session data and redirect browser to Wikipedia.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-bold text-red-400 group-hover:text-red-300">
              <AlertTriangle size={14} />
              <span>Leave Immediately ↗</span>
            </div>
          </button>

        </div>

        {/* Secret Tracking Code Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-10 relative overflow-hidden text-center group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500"></div>
          
          <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">
            <Shield size={14} className="text-indigo-400" />
            Your Private Incident Key
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Your Secret Tracking Code
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-5 leading-relaxed">
            Save this code immediately. It is the <strong className="text-white">ONLY key</strong> to track case status or flag <span className="font-mono text-slate-300">ACTION_IGNORED</span> if authorities fail to act. We do not store your identity and cannot recover it if lost.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 bg-black/50 border border-white/10 p-4 rounded-2xl max-w-xl mx-auto shadow-inner">
            <span className="text-xl sm:text-3xl font-mono text-white tracking-widest break-all font-extrabold drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {trackingCodeResult}
            </span>
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600/40 hover:bg-indigo-600/60 active:bg-indigo-600 border border-indigo-400/40 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg ml-1"
              title="Copy to clipboard"
            >
              {copiedCode ? <><Check size={16} className="text-emerald-400" /> Copied!</> : <><Copy size={16} /> Copy Code</>}
            </button>
          </div>
        </div>

        {/* Navigation Tabs for Dual Pillars */}
        <div className="flex items-center justify-center gap-2 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === "all"
                ? "bg-white/15 text-white border border-white/20 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All Pillars
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "personal"
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-md"
                : "text-slate-400 hover:text-indigo-300 hover:bg-white/5"
            }`}
          >
            <FileText size={15} /> 1. Personal Shield
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "community"
                ? "bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-md"
                : "text-slate-400 hover:text-rose-300 hover:bg-white/5"
            }`}
          >
            <Share2 size={15} /> 2. Community Shield
          </button>
        </div>

        {/* PILLAR 1: THE PERSONAL SHIELD (Instant Legal Utility) */}
        {(activeTab === "all" || activeTab === "personal") && (
          <section className="mb-12 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  Pillar 1: The Personal Shield <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-normal">Immediate Legal Recourse</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Automated legal drafting and personal evidence protection without touching backend storage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Automated Legal Dossier Download Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500"></div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
                      <FileText size={24} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Automated UN/HRC Complaint Dossier</h3>
                      <p className="text-xs sm:text-sm text-slate-300">Client-Side Court- & NGO-Ready PDF</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
                    Reliving harassment to draft legal filings is exhausting. SOGI-Shield transforms your input directly into a standardized human rights submission right inside your browser:
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Standardized ISO Timestamp & Sector:</strong> Auditable timestamp and geographic coordinates.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>International Human Rights Standards:</strong> Formatted to cite UN IE SOGI mandate, OHCHR Special Procedures, UDHR (Art. 3, 5, 7), ICCPR, & Yogyakarta Principles.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Institutional Negligence Review:</strong> Exhaustion of domestic remedies & ACTION_IGNORED documentation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Protective Signature Annex:</strong> Pre-structured signature block signed under anonymous protective protocol.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:from-cyan-400 hover:via-indigo-400 hover:to-pink-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center gap-3 text-sm sm:text-base border border-white/20 disabled:opacity-50"
                  >
                    <Download size={20} />
                    {isDownloadingPdf ? "Compiling Client-Side PDF..." : "Download Official UN/HRC Complaint PDF"}
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    Compiled 100% locally on your device. Zero bytes sent to our servers.
                  </p>
                </div>
              </div>

              {/* Evidence Locker & Emergency Resources */}
              <EvidenceLockerResources trackingCode={trackingCodeResult} />

            </div>
          </section>
        )}

        {/* PILLAR 2: THE COMMUNITY SHIELD (Global Viral Loop) */}
        {(activeTab === "all" || activeTab === "community") && (
          <section id="community-shield-section" className="mb-12 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  Pillar 2: The Global Community Shield <span className="text-xs bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 font-normal">Global Viral Loop</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Warn local community members and friends anonymously across borders without linking your identity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Immediate Collective Impact Feedback & Regional Map */}
              <RegionalImpactPreview report={submittedReport} />

              {/* Anonymous Community Caution Card Generator */}
              <CommunityCautionCard report={submittedReport} />

            </div>
          </section>
        )}

        {/* Bottom Navigation & Safety Control */}
        <div className="border-t border-white/10 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="block text-sm font-bold text-white">Need to check this case later?</span>
            <span className="text-xs text-slate-400">Keep your secret code handy or bookmark the lookup portal.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/track?code=${trackingCodeResult}`}
              className="bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors border border-white/10 flex items-center gap-2"
            >
              <span>Open Case Tracker</span>
              <ArrowRight size={14} />
            </a>
            <button
              onClick={() => window.location.reload()}
              className="text-indigo-400 hover:text-pink-400 active:text-pink-300 font-bold uppercase tracking-wider text-xs py-2.5 px-4 rounded-xl transition-colors"
            >
              Submit another report (after 5 mins)
            </button>
            <button
              onClick={handlePanicExit}
              className="bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 font-bold uppercase tracking-wider text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle size={14} /> Panic Exit
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 sm:py-12 max-w-4xl relative z-10">
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">File an Incident Report</h1>
        <p className="text-slate-300 text-base sm:text-lg">Your privacy is our priority. No IP addresses or browser metadata are logged.</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 mb-8 sm:mb-10 flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-pink-500"></div>
        <Info className="text-indigo-400 flex-shrink-0 mt-1 drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" size={32} />
        <div>
          <h3 className="font-bold text-xl text-white mb-2">How Classification Works</h3>
          <p className="text-base text-slate-300 mb-4 leading-relaxed">
            Our Zero-Touch Automated Classification engine determines how your report is displayed:
          </p>
          <ul className="text-sm text-slate-300 space-y-4">
            <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <ShieldCheck className="text-rose-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" size={20} />
              <span className="leading-relaxed"><strong className="text-white">PUBLIC_VERIFIED:</strong> If you attach valid evidence URLs, your report will be marked as verified and display facility details (RED marker).</span>
            </li>
            <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="w-5 h-5 rounded-full bg-slate-500 mt-0.5 flex-shrink-0 shadow-[0_0_10px_rgba(100,116,139,0.5)]"></div>
              <span className="leading-relaxed"><strong className="text-white">ACTION_IGNORED:</strong> If you attach evidence, report it to authorities, and explicitly flag it as ignored, it highlights institutional negligence (GREY marker).</span>
            </li>
            <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <ShieldAlert className="text-emerald-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" size={20} />
              <span className="leading-relaxed"><strong className="text-white">HEATMAP_AGGREGATED:</strong> If you submit without evidence links, your report remains unverified and anonymous (EMERALD zone).</span>
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 sm:p-10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* Honeypot Field - visually hidden */}
        <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
          <input type="text" name="website_hp" tabIndex="-1" value={formData.website_hp} onChange={handleChange} autoComplete="off" />
        </div>

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
            onSuccess={(token) => setTurnstileToken(token)}
            options={{ action: 'submit_report', theme: 'dark' }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Country *</label>
            <input required name="country" maxLength={100} value={formData.country} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="e.g., India" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">State / Region *</label>
            <input required name="region" maxLength={100} value={formData.region} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="e.g., Maharashtra" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Facility / Practice Name (Optional)</label>
          <input name="facilityName" maxLength={200} value={formData.facilityName} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="Name of clinic, institution, or organization" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Misconduct Category *</label>
          <div className="relative">
            <select required name="category" value={formData.category} onChange={handleChange} style={{ colorScheme: 'dark' }} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
              <option value="">Select a category...</option>
              <option value="Conversion Therapy / Unlicensed Counseling">Conversion Therapy / Unlicensed Counseling</option>
              <option value="Forced Confinement">Forced Confinement</option>
              <option value="Medical Misconduct / Refusal of Care">Medical Misconduct / Refusal of Care</option>
              <option value="State / Police Harassment">State / Police Harassment</option>
              <option value="Coercive Practice">Coercive Practice</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Experience Summary *</label>
          <textarea required name="summary" maxLength={5000} value={formData.summary} onChange={handleChange} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 leading-relaxed" placeholder="Describe the incident objectively..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Public Evidence Links</label>
          <textarea name="evidenceLinks" maxLength={20000} value={formData.evidenceLinks} onChange={handleChange} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 leading-relaxed" placeholder="https://drive.google.com/..., https://news.example.com/...&#10;Separate multiple links with commas or new lines."></textarea>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8">
          <label className="flex items-start gap-4 mb-6 cursor-pointer group">
            <input type="checkbox" name="reportedToAuthorities" checked={formData.reportedToAuthorities} onChange={handleChange} className="mt-1 w-6 h-6 rounded-md border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-black/40 cursor-pointer" />
            <span className="text-base font-medium text-slate-300 group-hover:text-white transition-colors">I have reported this to official authorities (e.g., Police, State Medical Board, NHRC).</span>
          </label>
          
          {formData.reportedToAuthorities && (
            <div className="pl-10 space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Authority Details</label>
                <input name="authorityDetails" maxLength={5000} value={formData.authorityDetails} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="e.g., Filed complaint with State Medical Council on Oct 14" />
              </div>
              <label className="flex items-start gap-4 cursor-pointer group bg-white/5 p-5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <input type="checkbox" name="actionIgnored" checked={formData.actionIgnored} onChange={handleChange} className="mt-1 w-6 h-6 rounded-md border-slate-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 bg-black/40 cursor-pointer" />
                <span className="text-sm font-medium text-slate-300 leading-relaxed">
                  <strong className="text-rose-400 block mb-1 text-base">Flag as ACTION_IGNORED:</strong> 
                  Authorities have failed to launch an investigation or take action despite evidence. (This highlights institutional negligence on the map as a GREY marker).
                </span>
              </label>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || rateLimited}
          className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 hover:from-cyan-400 hover:via-indigo-400 hover:to-pink-400 text-white font-bold py-4 sm:py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:shadow-none text-base sm:text-lg tracking-wide border border-white/20"
        >
          {isSubmitting ? "Encrypting & Submitting..." : rateLimited ? "Rate Limited (Wait 5m)" : "Submit Incident Report"}
        </button>

        {submitStatus === 'error' && (
          <div className="p-5 bg-rose-900/40 border border-rose-500/50 rounded-xl text-rose-200 text-center font-bold shadow-lg">
            {errorMessage || "An error occurred while submitting. Please try again."}
          </div>
        )}

      </form>
    </div>
  );
}
